<template>
  <v-app dark>
    <v-main class="main-app">
      <Nuxt />
    </v-main>
    <v-footer app fixed class="d-flex">
      <v-spacer />
      <div>
        <p class="ma-0 text-subtitle-2" >© Tranvandung.melinh@gmail.com</p>
      </div>
      <v-spacer />
    </v-footer>
  </v-app>
</template>
<script>
export default {
  data() {
    return {
      drawer: false,
    }
  },
  mounted() {},
}
</script>
<style lang="scss">
@import '~/assets/live-chat-main.scss';
</style>
  