<template>
  <v-container>
    <v-row no-gutters>
      <!-- <v-col cols="3" md="3" sm="12">
        <videos-user-stream
          :config="myStream"
          :muted="true"
          hiddenName
        ></videos-user-stream>
      </v-col> -->
      <v-col
        cols="3"
        md="3"
        sm="12"
        v-for="(stream, vindex) in contacts"
        :key="vindex"
      >
        <videos-user-stream :config="stream" />
      </v-col>
      <v-col
        cols="3"
        md="3"
        sm="12"
        v-for="(stream, vindex) in contacts"
        :key="vindex"
      >
        <videos-user-stream :config="stream" />
      </v-col>
    </v-row>
  </v-container>
</template>

<script>
import { mapState } from 'vuex';

export default {
  computed: {
    ...mapState({
      contacts: (state) => state.app.contacts,
    }),
  },
}
</script>