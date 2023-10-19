
export const state = () => ({
  app: {
    userId: "",
    userName: "",
    roomId: "",
    isJoinRoom: false,
    pcConfig: {
      iceServers:
        [
          // { "url": "stun:stun2.1.google.com:19302" },
          // { url: "stun:stun.jap.bloggernepal.com:5349" },
          // {
          //   url: "turn:turn.jap.bloggernepal.com:5349",
          //   username: "guest",
          //   credential: "somepassword"
          // },

          {
            "urls": "stun:global.stun.twilio.com:3478"
          },
          {
            "username": "dc2d2894d5a9023620c467b0e71cfa6a35457e6679785ed6ae9856fe5bdfa269",
            "credential": "tE2DajzSJwnsSbc123",
            "urls": "turn:global.turn.twilio.com:3478?transport=udp"
          },
          {
            "username": "dc2d2894d5a9023620c467b0e71cfa6a35457e6679785ed6ae9856fe5bdfa269",
            "credential": "tE2DajzSJwnsSbc123",
            "urls": "turn:global.turn.twilio.com:3478?transport=tcp"
          },
          {
            "username": "dc2d2894d5a9023620c467b0e71cfa6a35457e6679785ed6ae9856fe5bdfa269",
            "credential": "tE2DajzSJwnsSbc123",
            "urls": "turn:global.turn.twilio.com:443?transport=tcp"
          }
        ]
    },
    chats: [],
    contacts: [],
    myVideoStream: null,
    screenVideoStream: null
  },
})

export const mutations = {
  updateStore(state, payload) {
    state.app = {
      ...state.app,
      ...payload
    }
  },
  updateContact(state, contact) {
    if (!contact || !contact.userId) {
      return;
    }
    const oldC = state.app.contacts;
    let contacts = oldC.filter(c => c.userId !== contact.userId);
    contacts.push(contact);
    state.app = {
      ...state.app,
      contacts
    }
  },
};

