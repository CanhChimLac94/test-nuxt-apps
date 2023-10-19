<template>
  <div class="chat-contaner pa-2 pb-0 d-flex">
    <div class="chat-contents">
      <div class="message d-flex" v-for="(chat, index) in chats" :key="index">
        <b :class="getClassAccount(chat)">
          <v-icon class="mx-0">mdi-account-circle-outline</v-icon>
          <span class="username mr-1" v-text="chat.userName"></span>
        </b>
        <span class="grey--text2 text--darken-42" v-text="chat.message"></span>
      </div>
    </div>
    <div class="message-contanter d-flex">
      <!-- <v-row class="ma-0 pa-0"> -->
      <v-col class="pa-0 ma-0">
        <v-text-field
          class="chat-message"
          v-model="message"
          desen
          filled
          rounded
          append-outer-icon="mdi-send"
          @click:append-outer="sendMessage()"
          @keydown.enter="sendMessage()"
        ></v-text-field>
      </v-col>
      <!-- </v-row> -->
    </div>
  </div>
</template>
<script>
import ChatSevice from '~/mixins/components/tab-chat-mixin'
export default {
  mixins: [ChatSevice],
}
</script>
<style scoped lang="scss">
.chat-contaner {
  color: #fff;
  height: 100%;
  flex-direction: column;
  .chat-contents {
    flex-grow: 1;
    overflow-y: auto;
    .message {
      flex-direction: column;
      flex-grow: 1;
      width: 100%;
      > b.right {
        margin-left: auto;
        padding-right: 1rem;
        .v-icon,
        .username {
          float: right;
        }
      }
      > span {
        background-color: #353f50;
        margin: 1rem 0;
        padding: 0.5rem;
        border-radius: 5px;
      }
    }
  }
}
</style>