
export default {
  SOCKET_SERVER: "https://trandung.ddns.net",
  // SOCKET_SERVER: "http://localhost:3030",
  APP: {
    SOCKET: null,
    VIDEOS: [],
  },
  MEDIA_TYPE: {
    AUDIO: 'audio',
    VIDEO: 'video',
  },
  STREAM_TYPE: {
    USER: "user",
    SCREEN: "screen"
  },
  SOCKET_EVENTS: {
    ON_CONNECT: 'connect',
    JOIN_ROOM: 'join-room',
    USER_READY: 'user-ready',
    ORTHER_USER_CONNECTED: 'other-user-connected',
    OLD_USER: 'old-user',
    SEND_MESSAGE: 'send-message',
    CREATE_MESSAGE: 'createMessage',
    NEW_CALL: 'new-Call',
    ANSWER_CALL: 'answer-call',
    SHARE_SCREEN: 'share-screen',
    ANSWER_SHARE_SCEEN: 'answer-shrea-screen',
    ICE_CANDIDATE: 'ICEcandidate',

  },
  WINDOWN_CONTACT_MODE: {
    MINIME: 'min',
    
  }

}