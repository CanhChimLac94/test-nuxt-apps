<template>
  <div class="live-container">
    <v-row class="header pa-0 ma-0 d-none">
      <div class="logo">
        <h3 class="room-name" v-text="userName"></h3>
      </div>
    </v-row>
    <v-row class="main-container ma-0 pa-0">
      <v-col
        class="main-left pa-0"
        cols="12"
        :sm="isShowChat ? 10 : 12"
        :class="isShowChat ? 'd-none d-sm-flex' : ''"
      >
        <div
          class="videos-group"
          ref="videoGroup"
          @mousemove="onMovingContact"
          @mouseup="onDisableMoveContact"
        >
          <v-row class="ma-0 pa-0 fill-height">
            <v-col cols="12" class="main-video pa-0 fill-height">
              <div class="main-video-showing" :style="styleMainVideo">
                <videos-user-stream
                  v-if="screenVideoStream"
                  :config="screenStream"
                  :muted="true"
                  hiddenName
                ></videos-user-stream>
              </div>

              <div
                class="user-videos-popup pa-0"
                ref="popupContacts"
                :style="moveContactInfo.location"
              >
                <div class="head-options d-flex blue-grey darken-4">
                  <v-btn icon class="" @mousedown="onEnableMoveContact">
                    <v-icon>mdi-drag</v-icon>
                  </v-btn>
                  <v-btn
                    icon
                    class="ml-auto"
                    @click="isMinContacts = !isMinContacts"
                  >
                    <v-icon>{{
                      false === isMinContacts
                        ? 'mdi-minus'
                        : 'mdi-checkbox-blank-outline'
                    }}</v-icon>
                  </v-btn>
                </div>
                <div class="account-videos" v-if="!isMinContacts">
                  <v-container>
                    <v-row no-gutters>
                      <v-col cols="12" :md="userVideosCol">
                        <videos-user-stream
                          :config="myStream"
                          :muted="true"
                        ></videos-user-stream>
                      </v-col>

                      <v-col
                        cols="12"
                        :md="userVideosCol"
                        v-for="(stream, vindex) in contacts"
                        :key="vindex"
                      >
                        <videos-user-stream :config="stream" />
                      </v-col>
                    </v-row>
                  </v-container>
                </div>
              </div>
            </v-col>
          </v-row>
        </div>
        <div class="options actions d-flex">
          <div class="options-left d-flex">
            <v-btn icon color="primary" class="" @click="onCamTogether()">
              <v-icon v-if="enableCam" color="green lighten-4"
                >mdi-video</v-icon
              >
              <v-icon v-else color="orange darken-4">mdi-video-off</v-icon>
            </v-btn>
            <v-btn icon color="primary" class="ml-2" @click="onMicTogether()">
              <v-icon v-if="enableMic" color="green lighten-4"
                >mdi-microphone</v-icon
              >
              <v-icon v-else color="orange darken-4">mdi-microphone-off</v-icon>
            </v-btn>
            <v-btn icon color="primary" class="ml-2" @click="onShareScreen()">
              <v-icon v-if="enableShareScreen" color="green lighten-4"
                >mdi-monitor-multiple</v-icon
              >
              <v-icon v-else color="orange darken-4">mdi-monitor-off</v-icon>
            </v-btn>
            <v-btn icon @click="onRecordScreen">
              <v-icon>mdi-record</v-icon>
            </v-btn>
          </div>

          <div class="options-right ml-auto">
            <v-btn icon color="red" @click="onEndCall()">
              <v-icon>mdi-phone-cancel</v-icon>
            </v-btn>
            <v-btn icon color="primary" @click="onShowShareRoom()">
              <v-icon>mdi-account-plus</v-icon>
            </v-btn>
            <v-btn icon color="white" @click="isShowChat = !isShowChat">
              <v-icon>mdi-chat</v-icon>
            </v-btn>
          </div>
        </div>
      </v-col>
      <v-col class="main-right pa-0" cols="12" sm="2" v-if="isShowChat">
        <div class="header-tabs">
          <v-tabs conter-active v-model="tab">
            <v-tab>
              <v-icon>mdi-chat</v-icon>
            </v-tab>
            <!-- <v-tab>
              <v-icon>mdi-account-box-outline</v-icon>
            </v-tab> -->

            <v-btn
              class="ml-auto"
              icon
              color="white"
              @click="isShowChat = !isShowChat"
            >
              <v-icon>mdi-minus</v-icon>
            </v-btn>
          </v-tabs>
        </div>

        <v-tabs-items v-model="tab" dark class="contents-tabs">
          <v-tab-item class="fill-height">
            <tabs-tab-chat></tabs-tab-chat>
          </v-tab-item>
          <v-tab-item class="fill-height">
            <tabs-tab-accounts></tabs-tab-accounts>
          </v-tab-item>
        </v-tabs-items>
      </v-col>
    </v-row>

    <v-dialog v-model="isShowShareRoom" max-width="600px">
      <v-card>
        <v-card-title class="d-flex">
          <span class="mr-auto">Invite user</span>
          <v-icon color="red" class="ml-auto" @click="isShowShareRoom = false"
            >mdi-close</v-icon
          >
        </v-card-title>
        <v-card-text>
          <v-row class="mt-4">
            <v-col cols="12">
              <v-text-field
                v-model="linkRoom"
                solo
                readonly
                append-outer-icon="mdi-content-copy"
                @click:append-outer="onCopyShareRoom()"
              ></v-text-field>
            </v-col>
          </v-row>
        </v-card-text>
      </v-card>
    </v-dialog>
  </div>
</template>
<script>
import live from '~/mixins/components/live-mixin'

export default {
  mixins: [live],
}
</script>
<style scoped lang="scss">
@import '~/assets/live-chat-home.scss';
</style>
