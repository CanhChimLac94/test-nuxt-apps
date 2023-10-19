const baseURL = "https://mydev.ddns.net";
const videoGrid = document.getElementById("video-grid");
const myVideo = document.createElement("video");
const showChat = document.querySelector("#showChat");
const backBtn = document.querySelector(".header__back");
let socket;

myVideo.muted = true;

backBtn.addEventListener("click", () => {
  document.querySelector(".main__left").style.display = "flex";
  document.querySelector(".main__left").style.flex = "1";
  document.querySelector(".main__right").style.display = "none";
  document.querySelector(".header__back").style.display = "none";
});

showChat.addEventListener("click", () => {
  document.querySelector(".main__right").style.display = "flex";
  document.querySelector(".main__right").style.flex = "1";
  document.querySelector(".main__left").style.display = "none";
  document.querySelector(".header__back").style.display = "block";
});

const myName = prompt("Nhập tên của bạn");

const ROOM_ID = 1234;

// var peer = new Peer(undefined, {
//   path: "/peerjs",
//   host: "mydev.ddns.net",
//   port: "443",
// });

let myVideoStream;
let otherUser;
let remoteRTCMessage;

let iceCandidatesFromCaller = [];
let peerConnection;
let remoteStream;
let callInProgress = false;

// const openMediaDevices = () => {
//   navigator.mediaDevices
//     .getUserMedia({
//       audio: true,
//       video: true,
//     })
//     .then((stream) => {
//       myVideoStream = stream;
//       addVideoStream(myVideo, stream);

//       peer.on("call", (call) => {
//         console.log("peer on call: ");

//         call.answer(stream);
//         const video = document.createElement("video");

//         call.on("stream", (userVideoStream) => {
//           console.log("on call, on stream:");
//           addVideoStream(video, userVideoStream);
//         });
//       });

//       socket.on("user-connected", (userId, userName) => {
//         console.log("user-connected", { userId, userName });
//         connectToNewUser(userId, stream, userName);
//       });

//     });
// }

// openMediaDevices();

// const connectToNewUser = (userId, stream, userName) => {
//   const call = peer.call(userId, stream);
//   const video = document.createElement("video");
//   console.log("connectToNewUser:", { userId, stream, userName });

//   call.on("stream", (userVideoStream) => {
//     console.log("newUser on stream:", userName);
//     addVideoStream(video, userVideoStream);
//   });
// };

// peer.on("open", (id) => {
//   socket.emit("join-room", ROOM_ID, id, user);
// });


let pcConfig = {
  "iceServers":
    [
      { "url": "stun:stun.jap.bloggernepal.com:5349" },
      {
        "url": "turn:turn.jap.bloggernepal.com:5349",
        "username": "guest",
        "credential": "somepassword"
      }
    ]
};

// Set up audio and video regardless of what devices are present.
let sdpConstraints = {
  offerToReceiveAudio: true,
  offerToReceiveVideo: true
};

const addVideoStream = (video, stream) => {
  video.srcObject = stream;
  video.addEventListener("loadedmetadata", () => {
    video.play();
    videoGrid.append(video);
  });
};

function connectSocket() {
  // socket = io.connect(baseURL, {
  //   query: {
  //     name: myName
  //   }
  // });
  socket = io(baseURL);

  socket.emit("join-room", ROOM_ID, myName, myName);

  socket.on('user-connected', (userId, userName) => {
    console.log("user connected: ", { userId, userName });
  });

  socket.on("createMessage", (message, userName) => {
    messages.innerHTML =
      messages.innerHTML +
      `<div class="message">
          <b><i class="far fa-user-circle"></i> <span> ${userName === user ? "me" : userName
      }</span> </b>
          <span>${message}</span>
      </div>`;
  });

  socket.on('newCall', data => {
    //when other called you
    // console.log("on new Call: ", data);
    otherUser = data.caller;
    remoteRTCMessage = data.rtcMessage;
    this.answer();
  });

  socket.on('callAnswered', data => {
    //when other accept our call
    remoteRTCMessage = data.rtcMessage
    peerConnection.setRemoteDescription(new RTCSessionDescription(remoteRTCMessage));

    // document.getElementById("calling").style.display = "none";

    console.log("Call Started. They Answered");
    // console.log(pc);

    callInProgress = true;
  });

  socket.on('ICEcandidate', data => {
    // console.log(data);
    // console.log("GOT ICE candidate");
    let message = data.rtcMessage
    let candidate = new RTCIceCandidate({
      sdpMLineIndex: message.label,
      candidate: message.candidate
    });

    if (peerConnection) {
      // console.log("ICE candidate Added");
      peerConnection.addIceCandidate(candidate);
    } else {
      // console.log("ICE candidate Pushed");
      iceCandidatesFromCaller.push(candidate);
    }
  });

  // beReady();
}

function beReady() {
  return navigator.mediaDevices
    .getUserMedia({
      audio: true,
      video: true,
    })
    .then((stream) => {
      myVideoStream = stream;
      addVideoStream(myVideo, stream);
      return createConnectionAndAddStream();
    }).catch(function (e) {
      alert('getUserMedia() error: ' + e.name);
    });
}

function createConnectionAndAddStream() {
  // console.log("createConnectionAndAddStream");
  createPeerConnection();
  peerConnection.addStream(myVideoStream);
  return true;
}

function call() {
  beReady().then(stream => {
    processCall("userToCall");
  });
}

function processCall(userName) {
  peerConnection.createOffer((sessionDescription) => {
    peerConnection.setLocalDescription(sessionDescription);
    //to send a call
    console.log("Send Call");
    socket.emit("call", {
      name: userName,
      rtcMessage: sessionDescription
    });
  }, (error) => {
    console.log("Error");
  });
}

/**
 * 
 * @param {Object} data 
 * @param {number} data.user - the other user //either callee or caller 
 * @param {Object} data.rtcMessage - iceCandidate data 
 */
function sendICEcandidate(data) {
  //send only if we have caller, else no need to
  // console.log("Send ICE candidate");
  socket.emit("ICEcandidate", data)
}

function processAccept() {
  peerConnection.setRemoteDescription(new RTCSessionDescription(remoteRTCMessage));
  peerConnection.createAnswer((sessionDescription) => {
    peerConnection.setLocalDescription(sessionDescription);

    if (iceCandidatesFromCaller.length > 0) {
      //I am having issues with call not being processed in real world (internet, not local)
      //so I will push iceCandidates I received after the call arrived, push it and, once we accept
      //add it as ice candidate
      //if the offer rtc message contains all thes ICE candidates we can ingore this.
      for (let i = 0; i < iceCandidatesFromCaller.length; i++) {
        //
        let candidate = iceCandidatesFromCaller[i];
        // console.log("ICE candidate Added From queue");
        try {
          peerConnection.addIceCandidate(candidate).then(done => {
            console.log(done);
          }).catch(error => {
            console.log(error);
          })
        } catch (error) {
          console.log(error);
        }
      }
      iceCandidatesFromCaller = [];
      // console.log("ICE candidate queue cleared");
    } else {
      console.log("NO Ice candidate in queue");
    }
    socket.emit("answerCall", {
      caller: otherUser,
      rtcMessage: sessionDescription
    });
  }, (error) => {
    console.log("Error");
  })
}

//event from html
function answer() {
  //do the event firing
  beReady()
    .then(bool => {
      processAccept();
    });
  // document.getElementById("answer").style.display = "none";
}

/////////////////////////////////////////////////////////
function createPeerConnection() {
  try {
    // peerConnection = new RTCPeerConnection(pcConfig);
    peerConnection = new RTCPeerConnection();
    peerConnection.onicecandidate = handleIceCandidate;
    peerConnection.onaddstream = handleRemoteStreamAdded;
    peerConnection.onremovestream = handleRemoteStreamRemoved;
    // console.log('Created RTCPeerConnnection');
    return;
  } catch (e) {
    console.log('Failed to create PeerConnection, exception: ' + e.message);
    alert('Cannot create RTCPeerConnection object.');
    return;
  }
}

function handleIceCandidate(event) {
  // console.log('icecandidate event: ', event);
  if (event.candidate) {
    // console.log("Local ICE candidate");
    // console.log(event.candidate.candidate);
    sendICEcandidate({
      user: otherUser,
      rtcMessage: {
        label: event.candidate.sdpMLineIndex,
        id: event.candidate.sdpMid,
        candidate: event.candidate.candidate
      }
    })

  } else {
    console.log('End of candidates.');
  }
}

function handleRemoteStreamAdded(event) {
  // console.log('Remote stream added.');
  const remoteVideo = document.createElement("video");
  remoteStream = event.stream;
  remoteVideo.srcObject = remoteStream;

  addVideoStream(remoteVideo, remoteStream);
}

function handleRemoteStreamRemoved(event) {
  console.log('Remote stream removed. Event: ', event);
  // remoteVideo.srcObject = null;
  video.srcObject = null;
}

/**
 * htmls
 */
let text = document.querySelector("#chat_message");
let send = document.getElementById("send");
let messages = document.querySelector(".messages");

send.addEventListener("click", (e) => {
  if (text.value.length !== 0) {
    socket.emit("message", text.value);
    text.value = "";
  }
});

text.addEventListener("keydown", (e) => {
  if (e.key === "Enter" && text.value.length !== 0) {
    socket.emit("message", text.value);
    text.value = "";
  }
});

const inviteButton = document.querySelector("#inviteButton");
const muteButton = document.querySelector("#muteButton");
const stopVideo = document.querySelector("#stopVideo");

muteButton.addEventListener("click", () => {
  const enabled = myVideoStream.getAudioTracks()[0].enabled;
  if (enabled) {
    myVideoStream.getAudioTracks()[0].enabled = false;
    html = `<i class="fas fa-microphone-slash"></i>`;
    muteButton.classList.toggle("background__red");
    muteButton.innerHTML = html;
  } else {
    myVideoStream.getAudioTracks()[0].enabled = true;
    html = `<i class="fas fa-microphone"></i>`;
    muteButton.classList.toggle("background__red");
    muteButton.innerHTML = html;
  }
});

stopVideo.addEventListener("click", () => {
  const enabled = myVideoStream.getVideoTracks()[0].enabled;
  if (enabled) {
    myVideoStream.getVideoTracks()[0].enabled = false;
    html = `<i class="fas fa-video-slash"></i>`;
    stopVideo.classList.toggle("background__red");
    stopVideo.innerHTML = html;
  } else {
    myVideoStream.getVideoTracks()[0].enabled = true;
    html = `<i class="fas fa-video"></i>`;
    stopVideo.classList.toggle("background__red");
    stopVideo.innerHTML = html;
  }
});

inviteButton.addEventListener("click", (e) => {
  // prompt(
  //   "Copy this link and send it to people you want to meet with",
  //   window.location.href
  // );
  call();
});

connectSocket();