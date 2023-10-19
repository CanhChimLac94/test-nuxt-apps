import { mapState } from 'vuex';
import { Manager } from "socket.io-client";
// const { v4: uuidv4 } = require("uuid")
import CONST from '~/const';
const { APP, MEDIA_TYPE, STREAM_TYPE, SOCKET_SERVER, SOCKET_EVENTS: SOC_EVTS } = CONST;

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
    isMinContacts: false,
    moveContactInfo: {},
    linkRoom: "",
    iceCandidatesFromCaller: [],
    iceCandidatesFromScreen: [],
    // myInfo: null,
    socketConnector: null,
    isShowChat: false,
    pcScreenOffer: null,
    pcScreenAnswer: null,
    userVideosCol: 12,
    styleMainVideo: {},
  }),
  watch: {
    screenVideoStream() {
      this.resizeScreen();
    },
    isMinContacts(){
      this.refreshContactLocaltion();
    }
  },
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
      window.visualViewport.addEventListener("resize", ($evt) => {
        this.resizeScreen();
        this.refreshContactLocaltion();
      });
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
      const contact = {
        ...account,
        pc: null,
        pcScreen: null,
        remoteRTCMessage: null,
      };
      this.updateStore({
        contacts: [
          ...this.contacts,
          contact,
        ],
      });
      this.iceCandidatesFromCaller[account.userId] = [];
      this.iceCandidatesFromScreen[account.userId] = [];
      return contact;
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
    socketOn(msg, callback) {
      this.socket.on("actions", rawData => {
        const { evt, data } = rawData;
        if (evt === msg)
          callback(data);
      });
    },
    socketEmit(msg, data) {
      this.socket.emit("actions", {
        evt: msg,
        data
      });
    },
    connectSocket() {
      const manager = new Manager(SOCKET_SERVER, {
        reconnectionDelayMax: 10000,
        query: {
          // "my-key": "my-value"
        }
      });

      const socket = manager.socket("/", {});
      socket.on(SOC_EVTS.ON_CONNECT, () => {
        const socketId = socket.io.engine.id;
        const myInfo = {
          roomId: this.roomId,
          userId: this.userId,
          userName: this.userName,
          sender: socketId,
        };
        this.myInfo = myInfo;
        this.beReady().then(() => {
          socket.emit(SOC_EVTS.JOIN_ROOM, myInfo);
          this.socketEmit(SOC_EVTS.USER_READY, myInfo);
        });

        socket.on(SOC_EVTS.ORTHER_USER_CONNECTED, (payload) => {
          this.socketEmit(SOC_EVTS.OLD_USER, myInfo);
        });
        this.socketOn(SOC_EVTS.USER_READY, user => {
          this.addContact(user);
          this.onToCall(user);
        });
        this.socketOn(SOC_EVTS.OLD_USER, payload => {
          const { userId } = payload;
          const sender = this.getCaller(userId);
          if (!sender) {
            this.addContact(payload);
          };
        });
        socket.on(SOC_EVTS.SEND_MESSAGE, (payload) => {
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
        this.socketOn(SOC_EVTS.NEW_CALL, data => {
          const caller = this.getCaller(data.userId) || {};
          const { connected } = caller;
          if (true === connected) return;
          this.updateContact({
            ...caller,
            remoteRTCMessage: data.rtcMessage,
            connected: true
          });
          this.beReady().then(() => {
            this.onAnswer(data);
          });
        });
        this.socketOn(SOC_EVTS.ANSWER_CALL, data => {
          const { rtcMessage, receiver } = data;
          const pcOffer = this.getPC(data.userId);
          console.log("call Answered pc: ", data);
          if (receiver.userId === this.userId) {
            pcOffer.setRemoteDescription(new RTCSessionDescription(rtcMessage));
          }
        });

        this.socketOn(SOC_EVTS.SHARE_SCREEN, data => {
          const { rtcMessage, userId, userName, roomId, sender, targetUserId, receiver, infoSender } = data;

          // const vitrualCallerOfScreen = this.addContact({
          //   userId, userName, roomId, sender
          // });
          // this.vitrualCallerOfScreen = vitrualCallerOfScreen;

          const createPeerConnectionForShare = () => {
            const iceCandidatesFromCaller = this.iceCandidatesFromScreen[userId];
            const sender = this.getCaller(infoSender.userId);
            if (!sender) return;
            let { pcScreen: pcScreenAnswer } = sender;
            if (!pcScreenAnswer) {
              pcScreenAnswer = this.createPeerConnection(infoSender, STREAM_TYPE.SCREEN);
            }
            this.updateContact({
              ...infoSender,
              pcScreen: this.pcScreenAnswer
            });
            pcScreenAnswer.setRemoteDescription(new RTCSessionDescription(rtcMessage));
            pcScreenAnswer.createAnswer((sessionDescription) => {
              pcScreenAnswer.setLocalDescription(sessionDescription);
              iceCandidatesFromCaller.forEach(c => {
                pcScreenAnswer.addIceCandidate(c);
              });
              this.iceCandidatesFromScreen[infoSender.userId] = [];
              this.updateContact({
                userId,
                pcScreen: pcScreenAnswer
              });
              this.socketEmit(SOC_EVTS.ANSWER_SHARE_SCEEN, {
                ...receiver,
                rtcMessage: sessionDescription,
                infoSender: {
                  ...receiver
                },
                receiver: {
                  ...infoSender
                }
              });
            }, (error) => {
              console.log("Error:", error);
            });
          }

          if (receiver.userId === this.userId) {
            this.beReady().then(() => {
              createPeerConnectionForShare();
            });
          }
        });
        this.socketOn(SOC_EVTS.ANSWER_SHARE_SCEEN, data => {
          const { rtcMessage, userId, userName, roomId, sender, receiver, infoSender } = data;
          if (this.userId === receiver.userId) {
            let { pcScreen: pcScreenOffer } = this.getCaller(infoSender.userId);
            pcScreenOffer.setRemoteDescription(new RTCSessionDescription(rtcMessage));
          }
        });
        this.socketOn(SOC_EVTS.ICE_CANDIDATE, data => {
          const { rtcMessage: message, targetUserId, targetUserName, infoSender, receiver, streamType } = data;
          if (!this.iceCandidatesFromCaller[infoSender.userId]) this.iceCandidatesFromCaller[infoSender.userId] = [];
          if (!this.iceCandidatesFromScreen[infoSender.userId]) this.iceCandidatesFromScreen[infoSender.userId] = [];

          const iceCandidatesList = STREAM_TYPE.USER === streamType
            ? this.iceCandidatesFromCaller[infoSender.userId]
            : this.iceCandidatesFromScreen[infoSender.userId];
          if (targetUserId === this.userId) {
            iceCandidatesList.push(new RTCIceCandidate({
              sdpMLineIndex: message.label,
              candidate: message.candidate,
            }));
          }
        });

      });
      this.socket = socket;
      return socket;
    },
    beReady(type = null) {
      const options = {
        audio: true,
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
      if (false === this.enableShareScreen) {
        // stop share screen
        return this.stopShareScreen();
      }
      if (this.screenVideoStream) {
        return;
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
        stream.getTracks().forEach(track => {
          track.addEventListener('ended', evt => {
            this.stopShareScreen();
            this.enableShareScreen = true;
          });
        })
        const createPcOfferShareScreen = (c) => {
          let { pcScreen: pcScreenOffer, userId, userName } = c;
          if (!pcScreenOffer) {
            pcScreenOffer = this.createPeerConnection(c, STREAM_TYPE.SCREEN);
            pcScreenOffer.createOffer((sessionDescription) => {
              pcScreenOffer.setLocalDescription(sessionDescription);
              //to send a call
              this.updateContact({
                userId,
                pcScreen: pcScreenOffer
              });
              this.socketEmit(SOC_EVTS.SHARE_SCREEN, {
                ...this.myInfo,
                rtcMessage: {
                  ...sessionDescription,
                },
                targetUserId: this.userId,
                receiver: {
                  userId, userName
                },
                infoSender: this.myInfo
              });

            }, (error) => {
              console.log("Error", error);
            });

          }
        }
        this.contacts.forEach(c => {
          createPcOfferShareScreen(c);
        });
        this.enableShareScreen = !this.enableShareScreen;
      });

    },
    stopShareScreen() {
      // dispath event stop share screen to other users
      this.contacts.forEach(c => {
        const { pcScreen } = c;
        if (pcScreen) pcScreen.close();
        this.updateContact({
          userId: c.userId,
          pcScreen: null
        })
      });
      if (!this.screenVideoStream) return;
      this.screenVideoStream.getTracks().forEach(track => {
        track.stop();
      });
      this.screenVideoStream = null;
      this.enableShareScreen = true;
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
        pc.onicecandidate = event => hand(event, this.handleIceCandidate);
        pc.ontrack = event => hand(event, this.handleAddTrack);
        pc.onsignalingstatechange = (event) => {
          switch (pc.signalingState) {
            case 'closed':
              this.handleRemoteStreamRemoved(event, caller, streamType);
              break;
          }
        };
        pc.onconnectionstatechange = (event) => {
          switch (pc.iceConnectionState) {
            case 'disconnected':
            case 'failed':
            case 'closed':
              this.handleRemoteStreamRemoved(event, caller, streamType);
              break;
          }
        };

        if (streamType === STREAM_TYPE.USER) {
          this.myVideoStream.getTracks().forEach((track) => {
            pc.addTrack(track, this.myVideoStream);//should trigger negotiationneeded event
          });
        } else if (streamType === STREAM_TYPE.SCREEN
          && this.screenVideoStream) {
          // console.log("create peer connection: ", { streamType, stream: this.screenVideoStream });

          this.screenVideoStream.getTracks().forEach((track) => {
            pc.addTrack(track, this.screenVideoStream);
          });

          // this.myVideoStream.getTracks().forEach((track) => {
          //   pc.addTrack(track, this.myVideoStream);//should trigger negotiationneeded event
          // });

        }
        return pc;
      } catch (ex) {
        // console.log('Cannot create RTCPeerConnection object:', ex);
      }
      return null;
    },
    handleIceCandidate(event, caller, streamType) {
      if (event.candidate) {
        const { candidate } = event;
        const { userId: targetUserId, userName: targetUserName } = caller;
        this.socketEmit(SOC_EVTS.ICE_CANDIDATE, {
          targetUserId, targetUserName,
          rtcMessage: {
            label: candidate.sdpMLineIndex,
            id: candidate.sdpMid,
            candidate: candidate.candidate,
          },
          infoSender: this.myInfo,
          receiver: caller,
          streamType,
        });
      } else {
        // console.log('End of candidates.', event);
      }
    },
    handleRemoteStreamRemoved(event, caller, streamType) {
      if (STREAM_TYPE.USER === streamType) {
        this.removeAccount(caller.userId);
      } else if (STREAM_TYPE.SCREEN === streamType) {
        // console.log("handle remove stream: ", caller);
        this.updateContact({
          userId: caller.userId,
          pcScreen: null,
        });
        this.screenVideoStream = null;
      }
    },
    handleAddTrack(evt, caller, streamType) {
      const account = this.getCaller(caller.userId);
      if (!account
        || account.stream) {
        return;
      }
      const stream = evt.streams[0];
      // console.log('add track:', { caller, stream, streamType, streams: evt.streams });
      if (STREAM_TYPE.SCREEN === streamType) {
        this.screenVideoStream = stream;
      } else {
        this.updateContact({
          ...account,
          stream,
        });
      }
    },
    onToCall(caller) {
      // this.processCall(caller);
      const contact = this.getCaller(caller.userId);
      if (!contact) {
        return;
      }
      let { pc: pcOffer } = contact;
      if (pcOffer) {
        return;
      }
      pcOffer = this.createPeerConnection(caller);
      console.log("process Call: ", caller);
      this.updateContact({
        ...contact,
        pc: pcOffer,
      });
      pcOffer.createOffer((sessionDescription) => {
        pcOffer.setLocalDescription(sessionDescription);
        this.socketEmit(SOC_EVTS.NEW_CALL, {
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
    onAnswer(caller) {
      const contact = this.getCaller(caller.userId);
      if (!contact) {
        return;
      }
      let { pc: pcAnswer, remoteRTCMessage } = contact;
      if (pcAnswer) {
        return;
      }
      const iceCandidatesFromCaller = this.iceCandidatesFromCaller[contact.userId];
      pcAnswer = this.createPeerConnection(caller);
      this.updateContact({
        ...contact,
        pc: pcAnswer,
      });
      pcAnswer.setRemoteDescription(new RTCSessionDescription(remoteRTCMessage));
      pcAnswer.createAnswer((sessionDescription) => {
        pcAnswer.setLocalDescription(sessionDescription);

        iceCandidatesFromCaller.forEach(c => {
          pcAnswer.addIceCandidate(c);
        });
        this.iceCandidatesFromCaller[contact.userId] = [];

        this.socketEmit(SOC_EVTS.ANSWER_CALL, {
          userId: this.userId,
          caller: this.userName,
          userName: this.userName,
          rtcMessage: {
            ...sessionDescription,
          },
          receiver: caller
        });

      }, (error) => {
        console.log("Error: ", error);
      });
    },

    onRecordScreen(evt) {
      if (!this.screenVideoStream) {
        return;
      }
      console.log("begin record");

      let recordedChunks = [];
      const mediaRecorder = new MediaRecorder(this.screenVideoStream);

      const saveFile = (recordedChunks) => {
        const blob = new Blob(recordedChunks, {
          type: 'video/webm'
        });
        // let filename = window.prompt('Enter file name');
        let filename = "record_video_test";
        const downloadLink = document.createElement('a');
        downloadLink.href = URL.createObjectURL(blob);
        downloadLink.download = `${filename}.webm`;

        document.body.appendChild(downloadLink);
        downloadLink.click();
        URL.revokeObjectURL(blob); // clear from memory
        document.body.removeChild(downloadLink);
      }

      mediaRecorder.ondataavailable = function (e) {
        if (e.data.size > 0) {
          recordedChunks.push(e.data);
        }
      };
      mediaRecorder.onstop = function () {
        saveFile(recordedChunks);
        recordedChunks = [];
      };
      mediaRecorder.start(200); // For every 200ms the stream data will be stored in a separate chunk.
      setTimeout(() => {
        mediaRecorder.stop();
      }, 6000);
      return mediaRecorder;
    },

    onEnableMoveContact(evt) {
      const rect = this.$refs.popupContacts.getBoundingClientRect();
      const rectParent = this.$refs.popupContacts.parentElement.getBoundingClientRect();

      this.moveContactInfo = {
        ...this.moveContactInfo,
        enable: true,
        evt,
        rect, rectParent,
        xOffset: rect.x - rectParent.x,
        yOffset: rect.y - rectParent.y,
        mY: evt.y,
        mX: evt.x,
        wP: rectParent.width,
      };
      // console.log("this.moveContactInfo: ", this.moveContactInfo);
    },
    onDisableMoveContact(evt) {
      this.moveContactInfo = {
        ...this.moveContactInfo,
        enable: false,
        evt,
      };
    },
    onMovingContact(evt) {
      if (!this.moveContactInfo
        || !this.moveContactInfo.enable
        || false === this.moveContactInfo.enable) {
        return;
      }
      const { xOffset, yOffset, mX, mY, wP, rect } = this.moveContactInfo;
      let left = evt.x - mX + xOffset;
      let top = evt.y - mY + yOffset;
      const wOffset = wP - rect.width;
      this.moveContactInfo = {
        ...this.moveContactInfo,
        location: {
          top: `${top < 0 ? 0 : top}px`,
          left: `${left > wOffset ? wOffset : left}px`,
        }
      }
    },
    refreshContactLocaltion() {
      const location = true === this.isMinContacts
        ? {
          left: `${0}px`,
          bottom: `${0}px`,
          top: 'auto'
        }
        : {
          top: `${0}px`,
          right: `${0}px`
        };
      this.moveContactInfo = {
        ...this.moveContactInfo,
        location,
      }
    },

    resizeScreen() {
      const rectVideoGroup = this.$refs.videoGroup.getBoundingClientRect();
      const maxheight = rectVideoGroup.width < rectVideoGroup.height ? rectVideoGroup.width : rectVideoGroup.height;
      const maxWidth = maxheight * 1.7;
      this.styleMainVideo = {
        maxWidth: `${maxWidth}px`
      };

    },


  },
  mounted() {
    this.init();
  },
  beforeRouteLeave(to, from) {
    this.onEndCall();
  },

}