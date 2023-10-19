<template>
  <div class="stream-container">
    <p v-text="userName" v-if="!hiddenName" class="user-name"></p>
    <!-- <video class="stream-video" ref="streamVideo" height="auto"></video> -->
    <canvas class="user-stream stream-video" ref="streamCanvas"></canvas>
  </div>
</template>
<script>
export default {
  props: {
    config: {
      type: Object,
    },
    stream: {
      type: MediaStream,
    },
    muted: {
      type: Boolean,
      default: false,
    },
    hiddenName: {
      type: Boolean,
      default: false,
    },
  },
  computed: {
    video() {
      return this.$refs.streamVideo
    },
  },
  data() {
    return {
      userName: '',
    }
  },
  methods: {
    init() {
      // const { video } = this;
      const { stream } = this.stream ? this : this.config
      this.userName = this.config.userName
      if (!stream) return
      const video = document.createElement('video');
      video.muted = this.muted;
      video.srcObject = stream;
      video.addEventListener('loadedmetadata', () => {
        video.play();
        this.handleResizeVideo();
        this.initCanvas(video);
      })

      // video.muted = this.muted
      // video.srcObject = stream
      // video.addEventListener('loadedmetadata', () => {
      //   video.play()
      // })
    },
    initCanvas(video) {
      const width = video.videoWidth
      const height = video.videoHeight
      const canvas = this.$refs.streamCanvas
      canvas.width = width
      canvas.height = height
      const context = canvas.getContext('2d')
      requestAnimationFrame(() => this.drawVideo(context, video, width, height))
    },
    drawVideo(context, video, width, height) {
      requestAnimationFrame(() => this.drawVideo(context, video, width, height))
      context.drawImage(video, 0, 0, width, height)
    },
    drawStream() {
      const { video, canvas, ctx } = this
      if (!video.pause && !video.ended) {
        ctx.drawImage(video, 0, 0)
        setTimeout(() => {
          drawStream()
        }, 100 / 3)
      }
    },
    handleResizeVideo() {},
  },
  mounted() {
    this.init()
  },
  watch: {
    config() {
      this.init()
    },
  },
}
</script>
<style lang="scss" scoped>
.stream-video,
.stream-container {
  max-width: 100% !important;
  max-height: inherit !important;
  position: relative;

  .user-name {
    position: absolute;
    top: 0;
    left: 0;
    background-color: rgba(0, 0, 0, 0);
    color: white;
    z-index: 11;
    padding: 0.25rem;
  }
}
</style>