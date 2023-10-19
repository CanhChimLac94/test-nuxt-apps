<template>
  <component :is="componentId"></component>
</template>
<script>
import index from './index'

export default {
  mixins: [index],
}
</script>
<style scoped lang="scss">
.actions {
  color: #fff;
}
</style>