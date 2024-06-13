<route lang="json5" type="page">
{
  style: {},
}
</route>
<template>
  <web-view v-if="url" :src="url" />
</template>

<script setup>
import { onLoad } from '@dcloudio/uni-app'
import { ref } from 'vue'

const url = ref('')

onLoad(function (options) {
  let tempUrl = decodeURIComponent(options.url)
  Object.keys(options)
    .filter((item) => item !== 'url')
    .forEach((item) => {
      tempUrl += (tempUrl.indexOf('?') !== -1 ? '&' : '?') + item + '=' + options[item]
    })
  url.value = tempUrl
})
</script>
