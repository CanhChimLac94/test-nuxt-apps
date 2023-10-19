import { mapState } from 'vuex';
import { Manager } from "socket.io-client";
const { v4: uuidv4 } = require("uuid");
import CONST from '~/const';
const { APP, MEDIA_TYPE, STREAM_TYPE, SOCKET_SERVER } = CONST;

export default {
  computed: {
    ...mapState({
      userId: state => state.app.userId,
      userName: state => state.app.userName,
      roomId: state => state.app.roomId,
      pcConfig: state => state.app.pcConfig,
      chats: state => state.app.chats,
      contacts: state => state.app.contacts,
    }),
    store() { return this.$store.state.app; },
    socket: {
      get() { return APP.SOCKET; },
      set(socket) { APP.SOCKET = socket }
    },
    // videos: {
    //   get() { return APP.VIDEOS; },
    //   set(videos) { APP.VIDEOS = videos; }
    // },
    myVideoStream: {
      get() { return this.store.myVideoStream; },
      set(val) {
        this.updateStore({
          myVideoStream: val
        })
      }
    },
    screenVideoStream: {
      get() { return this.store.screenVideoStream; },
      set(val) {
        this.updateStore({
          screenVideoStream: val
        })
      }
    },
    myStream() {
      return {
        stream: this.myVideoStream,
        userId: this.userId,
        userName: this.userName,
      }
    },
    screenStream() {
      return {
        stream: this.screenVideoStream,
        userId: this.userId,
        userName: this.userName,
      }
    }
  },
  data: () => ({
    tab: null,
    enableMic: true,
    enableCam: true,
    enableShareScreen: true,
    isShowShareRoom: false,
    linkRoom: "",
    iceCandidatesFromCaller: [],
    // myInfo: null,
    socketConnector: null,
    isShowChat: false,
  }),
  methods: {
    updateStore(payload) {
      this.$store.commit("updateStore", payload);
    },
    updateContact(contact) {
      if (!contact || !contact.userId) {
        return;
      }
      this.$store.commit("updateContact", contact);
    },
    init() {
      if (this.contacts.length > 0) {
        this.onEndCall();
      }
      this.connectSocket();
    },
    getPC(userId) {
      const caller = this.getCaller(userId);
      if (!caller) return caller;
      return caller.pc;
    },
    getCaller(userId) {
      return this.contacts.find(c => c.userId === userId);
    },
    getStreamData(video) {
      return video.outerHTML;
    },
    addContact(account, streamType = STREAM_TYPE.USER) {
      const c = this.getCaller(account.userId);
      if (c) {
        return c;
      }
      return this.beReady().then(() => {
        const contact = {
          ...account,
          pc: null,
          remoteRTCMessage: null,
        };
        this.updateStore({
          contacts: [
            ...this.contacts,
            contact,
          ],
        });
        return contact;
      });
    },
    addVideoStream(metaData) {
      const { stream, userId, userName } = metaData;
      this.updateStore({
        videos: [
          ...this.videos,
          {
            stream, userId, userName,
          }
        ],
      });
    },
    removeAccount(uId) {
      const contacts = this.contacts.filter(c => c.userId !== uId);
      this.updateStore({
        contacts
      });
    },
    removeContact(uId) {
      this.removeAccount(uId);
    },
    removeVideo(uId) {
      // const videos = this.videos.filter(v => v.userId !== uId);
      // this.updateStore({
      //   videos
      // })
    },
    connectSocket() {
      // const { iceCandidatesFromCaller } = this;
      // if(this.socketConnector){
      //   return;
      // }
      const manager = new Manager(SOCKET_SERVER, {
        reconnectionDelayMax: 10000,
        query: {
          // "my-key": "my-value"
        }
      });

      const socket = manager.socket("/", {});
      socket.on("connect", () => {
        const socketId = socket.io.engine.id;
        const myInfo = {
          roomId: this.roomId,
          userId: this.userId,
          userName: this.userName,
          sender: socketId,
        };
        // this.myInfo = myInfo;
        this.beReady().then(() => {
          socket.emit('user_ready', myInfo);
        });
        socket.emit("join-room", myInfo);
        socket.on('other-user-connected', (payload) => {
          socket.emit('old_user', myInfo);
        });
        socket.on('user_ready', (user) => {
          // console.log("user_ready", { user });
          this.addContact(user);
          this.onCall(user);
        });
        socket.on('old_user', payload => {
          // console.log("old_user", { payload });
          const { userId } = payload;
          const sender = this.getCaller(userId);
          if (!sender) {
            this.addContact(payload);
          };
        });
        socket.on("createMessage", (payload) => {
          const { message, userName } = payload;
          this.updateStore({
            chats: [
              ...this.chats,
              message
            ],
          });
        });
        /**
         * Call live chat
         */
        socket.on('newCall', data => {
          console.log("on new call: ", data);
          //when other called you
          const caller = this.getCaller(data.userId) || {};
          const { pc } = caller;
          if (pc) {
            return;
          }
          const cloneCaller = {
            ...caller,
            remoteRTCMessage: data.rtcMessage,
          };
          this.updateContact(cloneCaller);
          this.onAnswer(data);
        });

        socket.on('callAnswered', data => {
          //when other accept our call
          // const { peerConnection: PC } = this;
          const { rtcMessage, userId, userName } = data;
          const pc = this.getPC(data.userId);
          if (!pc) return;
          pc.setRemoteDescription(new RTCSessionDescription(rtcMessage));
        });
        socket.on('share_screen', data =>{
          console.log("socket on get offer share screen", data);
          const { rtcMessage, userId, userName, roomId, sender, targetUserId} = data;
          const targetU = this.getCaller(targetUserId);

          this.screenVideoStream = targetU.stream || null;
          
          return;
          this.addContact({
            userId, userName, roomId, sender
          }).then(shareScreenContact => {

            if(!this.pcShareScreen){
              this.pcShareScreen = this.createPeerConnection(shareScreenContact, STREAM_TYPE.SCREEN);
            }
            this.updateContact({
              ...shareScreenContact,
              pc: this.pcShareScreen
            });

            console.log("on get offer shareScreenContact: ", {shareScreenContact, pc: this.pcShareScreen});

            this.pcShareScreen.setRemoteDescription(new RTCSessionDescription(rtcMessage));
            this.pcShareScreen.createAnswer((sessionDescription) => {
              socket.emit('answer_shrea_screen', {
                ...shareScreenContact,
                rtcMessage: sessionDescription
              });
              this.iceCandidatesFromCaller.forEach(c => {
                this.pcShareScreen.addIceCandidate(c);
              });
              this.iceCandidatesFromCaller = [];
              
            }, (error) => {
              console.log("Error:", error);
            });

          });

        });
        socket.on('answer_shrea_screen', data => {
          console.log('get answer_shrea_screen: ', data);
          const { rtcMessage, userId, userName, roomId, sender} = data;
          if(!this.pcShareScreen){
            this.pcShareScreen = this.createPeerConnection(shareScreenContact, STREAM_TYPE.SCREEN);
          }
          this.pcShareScreen.setRemoteDescription(new RTCSessionDescription(rtcMessage)).then(d => {
            console.log('get answer_shrea_screen done: ', this.pcShareScreen);
            this.replaceTrack(this.screenVideoStream.getVideoTracks()[0], this.pcShareScreen);
          });
          

        });
        socket.on('ICEcandidate', data => {
          const { rtcMessage: message, userId, userName } = data;
          // const pc = this.getPC(userId);
          const candidate = new RTCIceCandidate({
            sdpMLineIndex: message.label,
            candidate: message.candidate,
          });

          this.iceCandidatesFromCaller.push(candidate);

          // this.contacts.forEach(c => {
          //   const { pc } = c;
          //   if (pc)
          //     pc.addIceCandidate(candidate);
          // });

        });
      });
      this.socket = socket;
      return socket;
    },
    beReady(type = null) {
      const options = {
        // audio: true,
        video: true,
      };
      if (type === MEDIA_TYPE.AUDIO) {
        options.video = undefined;
      }
      return navigator.mediaDevices
        .getUserMedia(options)
        .then((stream) => {
          this.myVideoStream = stream;
        }).catch((e) => {
          if (!type || !type === MEDIA_TYPE.VIDEO) {
            return this.beReady(MEDIA_TYPE.AUDIO);
          } else {
            alert('getUserMedia() error: ' + e.name);
          }
        });
    },
    onCamTogether() {
      const { myVideoStream } = this;
      const track = myVideoStream.getVideoTracks()[0];
      if (!track) {
        this.enableCam = false;
        return;
      }
      this.enableCam = !track.enabled;
      track.enabled = this.enableCam;
      this.broadcastNewTracks(myVideoStream, MEDIA_TYPE.VIDEO);
    },
    onMicTogether() {
      const { myVideoStream } = this;
      const track = myVideoStream.getAudioTracks()[0];
      if (!track) {
        this.enableMic = false;
        return;
      }
      this.enableMic = !track.enabled;
      track.enabled = this.enableMic;
      this.broadcastNewTracks(myVideoStream, MEDIA_TYPE.AUDIO);
    },
    onShowShareRoom() {
      this.isShowShareRoom = true;
      this.linkRoom = window.location.href;
    },
    onCopyShareRoom() {
      navigator.clipboard.writeText(this.linkRoom);
    },
    onShareScreen() {
      console.log('on share creen: ');
      this.enableShareScreen = !this.enableShareScreen;
      // const { socket } = this;
      if (false === this.enableShareScreen) {
        // stop share screen

      }
      navigator.mediaDevices.getDisplayMedia({
        video: {
          cursor: "always"
        },
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          sampleRate: 44100
        }
      }).then(stream => {

        this.screenVideoStream = stream;
        //--------------------------------
        this.broadcastNewTracks(stream, MEDIA_TYPE.VIDEO);
        //--------------------------------
        const callerShareScreen = {
          roomId: this.roomId,
          userId: uuidv4(),
          userName: `${this.userName}-share-screen`,
          sender: this.socket.io.engine.id,
        };
        this.pcShareScreen = this.createPeerConnection(callerShareScreen, STREAM_TYPE.SCREEN);
        // this.pcShareScreen.addStream(stream);
        console.log('create offer share screen');
        this.pcShareScreen.createOffer((sessionDescription) => {
          this.pcShareScreen.setLocalDescription(sessionDescription);
          //to send a call  
          this.socket.emit("share_screen", {
            ...callerShareScreen,
            rtcMessage: {
              ...sessionDescription,
            },
            targetUserId: this.userId
          });
        }, (error) => {
          console.log("Error", error);
        });
        /*
        this.contacts.forEach(c => {
          const { pc } = c;
          this.screenVideoStream.getTracks().forEach(track => {
            // console.log("screen add track:");
            // pc.addTrack(track, this.myVideoStream, this.screenVideoStream);
            pc.addTrack(track, this.screenVideoStream);
          });
        });
        */
      });

    },
    async onEndCall() {
      const { myVideoStream } = this;
      return new Promise((resolve, reject) => {
        this.contacts.forEach(contact => {
          const { pc } = contact;
          if (pc) pc.close();
        });
        this.updateStore({
          contacts: []
        });
        try {
          myVideoStream.getTracks().forEach((track) => {
            track.stop();
          });
          this.socket.close();
          this.socket.disconnect();
          // this.socket = null;
        } catch (err) {
          console.log("stop call error: ", err);
        }
        // this.$router.push('/');
        this.updateStore({ isJoinRoom: false });

        // return resolve();
      });
    },
    replaceTrack(stream, pc) {
      const sender = pc.getSenders
        ? pc.getSenders().find(s => s.track && s.track.kind === stream.kind)
        : false;
      sender ? sender.replaceTrack(stream) : '';
    },
    broadcastNewTracks(stream, type) {
      let track = type === MEDIA_TYPE.AUDIO
        ? stream.getAudioTracks()[0]
        : stream.getVideoTracks()[0];
      this.contacts.forEach(contact => {
        const { pc } = contact;
        this.replaceTrack(track, pc);
      });
    },
    createPeerConnection(caller, streamType = STREAM_TYPE.USER) {
      try {
        const pc = new RTCPeerConnection(this.pcConfig);
        // const pc = new RTCPeerConnection();
        const hand = (e, f) => {
          return f(e, caller, streamType);
        }
        // pc.onremovestream = event => hand(event, this.handleRemoteStreamRemoved);
        pc.onicecandidate = event => hand(event, this.handleIceCandidate);
        pc.ontrack = event => hand(event, this.handleAddTrack);
        pc.onsignalingstatechange = (event) => {
          switch (pc.signalingState) {
            case 'closed':
              // console.log("Signalling state is 'closed'");
              this.handleRemoteStreamRemoved(event, caller);
              break;
          }
        };
        pc.onconnectionstatechange = (event) => {
          switch (pc.iceConnectionState) {
            case 'disconnected':
            case 'failed':
            case 'closed':
              this.handleRemoteStreamRemoved(event, caller);
              break;
          }
        };

        if (streamType === STREAM_TYPE.USER) {
          this.myVideoStream.getTracks().forEach((track) => {
            pc.addTrack(track, this.myVideoStream);//should trigger negotiationneeded event
          });
        } else if (streamType === STREAM_TYPE.SCREEN
          && this.screenVideoStream) {
            console.log("create peer connection: ", {streamType, stream: this.screenVideoStream});
          // if(!this.screenVideoStream) return;
          // return;
          this.screenVideoStream.getTracks().forEach((track) => {
            // pc.addTrack(track, this.myVideoStream);//should trigger negotiationneeded event
            pc.addTrack(track, this.screenVideoStream);
          });

        }
        return pc;
      } catch (ex) {
        // console.log('Failed to create PeerConnection, exception: ' + ex.message);
        console.log('Cannot create RTCPeerConnection object.', ex);
      }
      return null;
    },
    handleIceCandidate(event, caller) {
      if (event.candidate) {
        const { candidate } = event;
        const { userId, userName } = caller;
        this.sendICEcandidate({
          userId, userName,
          rtcMessage: {
            label: candidate.sdpMLineIndex,
            id: candidate.sdpMid,
            candidate: candidate.candidate,
          }
        })
      } else {
        // console.log('End of candidates.', event);
      }
    },
    handleRemoteStreamRemoved(event, caller) {
      this.removeContact(caller.userId);
      this.removeVideo(caller.userId);
    },
    handleAddTrack(evt, caller, streamType) {
      const account = this.getCaller(caller.userId);
      if (!account
        || account.stream) {
        return;
      }
      const stream = evt.streams[0];
      console.log('add track:', { caller, stream, streamType, evt });
      if(STREAM_TYPE.SCREEN === streamType){
        this.screenVideoStream = stream;
      }
      this.updateContact({
        ...account,
        stream,
      });
    },
    sendICEcandidate(data) {
      //send only if we have caller, else no need to
      this.socket.emit("ICEcandidate", data);
    },
    onCall(caller) {
      this.beReady().then(stream => {
        this.processCall(caller);
      });
    },
    onAnswer(caller) {
      //do the event firing
      this.beReady()
        .then(() => {
          this.processAccept(caller);
        });
    },
    processCall(caller) {
      const contact = this.getCaller(caller.userId);
      if (!contact) {
        return;
      }
      let { pc } = contact;
      if (!pc) {
        pc = this.createPeerConnection(caller);
      }
      console.log("processCall: ", { caller });
      this.updateContact({
        ...contact,
        pc
      });
      pc.createOffer((sessionDescription) => {
        pc.setLocalDescription(sessionDescription);
        //to send a call  
        this.socket.emit("newCall", {
          name: this.userName,
          userId: this.userId,
          userName: this.userName,
          rtcMessage: {
            ...sessionDescription,
          },
        });
      }, (error) => {
        console.log("Error", error);
      });
    },
    processAccept(caller) {
      const contact = this.getCaller(caller.userId);
      if (!contact) {
        return;
      }
      let { pc, remoteRTCMessage } = contact;
      if (!pc) {
        pc = this.createPeerConnection(caller)
      }
      this.updateContact({
        ...contact,
        pc
      });

      pc.setRemoteDescription(new RTCSessionDescription(remoteRTCMessage));
      pc.createAnswer((sessionDescription) => {
        pc.setLocalDescription(sessionDescription);
        this.iceCandidatesFromCaller.forEach(c => {
          pc.addIceCandidate(c);
        });
        this.iceCandidatesFromCaller = [];
        this.socket.emit("answerCall", {
          userId: this.userId,
          caller: this.userName,
          userName: this.userName,
          rtcMessage: {
            ...sessionDescription,
          }
        });
      }, (error) => {
        console.log("Error");
      });

    },

  },
  mounted() {
    this.init();
  },
  beforeRouteLeave(to, from) {
    this.onEndCall();
  },

}