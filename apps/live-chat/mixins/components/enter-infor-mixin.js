const { v4: uuidv4 } = require("uuid");

export default {
  computed: {
    store: {
      get() {
        return this.$store.state.app;
      }
    },
    userName: {
      get() {
        return this.store.userName;
      },
      set(userName) {
        this.updateStore({ userName })
      }
    },
    roomId: {
      get() {
        return this.store.roomId;
      },
    },
    isJoinRoom: {
      get() {
        return this.state.isJoinRoom;
      },
      set(isJoinRoom) {
        this.updateStore({ isJoinRoom })
      }
    },
  },
  data: () => {
    return {
    }
  },
  methods: {
    updateStore(payload) {
      this.$store.commit('updateStore', payload);
    },
    init() {
      const names = ["D", "F"];
      // this.userName = names[Math.random(0, 2)];
      // this.onClickJoinRoom();
    },
    isDisableJoin() {
      return this.userName === "";
    },
    onClickJoinRoom() {
      if (!this.userName) return;
      this.updateStore({
        userId: uuidv4()
      })
      this.isJoinRoom = true;
    },
  },
  mounted() {
    this.init();
  },
}