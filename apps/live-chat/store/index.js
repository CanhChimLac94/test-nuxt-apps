
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
            url: "stun:stun.relay.metered.ca:80",
          },
          {
            url: "turn:a.relay.metered.ca:80",
            username: "8fe14f63420cfd1ca7d4d3ed",
            credential: "Nb3s8nM9ceDes0sr",
          },
          {
            url: "turn:a.relay.metered.ca:80?transport=tcp",
            username: "8fe14f63420cfd1ca7d4d3ed",
            credential: "Nb3s8nM9ceDes0sr",
          },
          {
            url: "turn:a.relay.metered.ca:443",
            username: "8fe14f63420cfd1ca7d4d3ed",
            credential: "Nb3s8nM9ceDes0sr",
          },
          {
            url: "turn:a.relay.metered.ca:443?transport=tcp",
            username: "8fe14f63420cfd1ca7d4d3ed",
            credential: "Nb3s8nM9ceDes0sr",
          },
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

