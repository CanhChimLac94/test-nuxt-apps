// const { v4: uuidv4 } = require("uuid");
import { uniqueId } from '~/unit';
import { mapState } from 'vuex'

const CARDS = {
  ENTER_INFO: 'EnterInfo',
  VIDEO_LIVE: 'videos-live',
}

export default {
  computed: {
    ...mapState({
      userName: (state) => state.app.userName,
      isJoinRoom: (state) => state.app.isJoinRoom,
    }),
    componentId() {
      if (!this.isJoinRoom) {
        return CARDS.ENTER_INFO
      } else {
        return CARDS.VIDEO_LIVE
      }
    },
    roomId: {
      get() {
        return this.store.roomId;
      },
      set(roomId) {
        this.updateStore({ roomId })
      }
    },
  },
  data: () => {
    return {

    }
  },
  methods: {
    init() {
      let roomId = this.$route.params.roomId;
      if (!roomId) roomId = this.$route.query.roomId;
      if (!roomId) {
        roomId = uniqueId(); // uuidv4();
        this.$router.push(`?roomId=${roomId}`);
      }
      this.roomId = roomId;
    },
    updateStore(payload) {
      this.$store.commit('updateStore', payload);
    },
  },
  mounted() {
    this.init();
  },
}