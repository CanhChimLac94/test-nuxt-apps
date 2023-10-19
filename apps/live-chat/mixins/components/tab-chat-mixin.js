import { mapState } from 'vuex';
import CONST from '~/const';
const { APP, SOCKET_EVENTS } = CONST;

export default {
  computed: {
    ...mapState({
      userId: state => state.app.userId,
      userName: state => state.app.userName,
      chats: state => state.app.chats,
      // roomId: state => state.app.roomId,
      // pcConfig: state => state.app.pcConfig,
    }),
    socket: {
      get() { return APP.SOCKET; },
      set(socket) { APP.SOCKET = socket }
    },
  },
  data() {
    return {
      message: "",
    }
  },
  methods: {
    sendMessage() {
      if (!this.socket
        || !(this.message.trim())) return;
      this.socket.emit(SOCKET_EVENTS.SEND_MESSAGE, {
        message: this.message.trim(),
        userId: this.userId,
        userName: this.userName
      });
      this.message = "";
    },
    getClassAccount(chat) {
      if (chat.userId === this.userId) {
        return "right";
      }
      return "left"
    },
    isMe(chat) {
      return chat.userId === this.userId;
    },

  },
}