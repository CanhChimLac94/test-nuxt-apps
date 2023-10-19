<template>
  <v-card class="ma-auto mt-2" max-width="500">
    <v-card-title> Nhập thông tin</v-card-title>
    <v-card-text>
      <v-row>
        <v-col cols="12">
          <v-text-field
            autofocus
            v-model="userName"
            label="Tên của bạn?"
            @keydown.enter="onClickJoinRoom()"
          ></v-text-field>
          <div class="actions d-flex">
            <span v-text="roomId" class="room-id"></span>
            <v-spacer />
            <v-btn
              class="success"
              :disabled="isDisableJoin()"
              @click="onClickJoinRoom()"
            >
              Tham gia chat
            </v-btn>
          </div>
        </v-col>
      </v-row>
    </v-card-text>
  </v-card>
</template>
<script>
import EnterInfo from '~/mixins/components/enter-infor-mixin'
export default {
  mixins: [EnterInfo],
  data: () => ({}),
  computed: {},
  methods: {},
}
</script>
<style scoped lang="scss">
.actions {
  color: #fff;
}
.room-id{
  color: #616161;
}
</style>