<!--
 * @Author: your name
 * @Date: 2024-03-18 17:16:02
 * @LastEditTime: 2024-03-18 17:19:09
 * @LastEditors: MacBook-Pro-5.local
 * @Description: In User Settings Edit
 * @FilePath: /mp-ai-shop/src/pages/common/transitPage.vue
-->
<route lang="json5" type="page">
{
  style: {
    navigationBarTitleText: '跳转中',
  },
}
</route>
<template>
  <view class="p-4 text-center">跳转中，请稍等</view>
</template>

<script setup>
import { navigator } from '@/utils/navigator'
import { onLoad } from '@dcloudio/uni-app'
import qs from 'qs'

function getQueryValue(options) {
  let query = options
  if (options.q) {
    try {
      query = qs.parse(decodeURIComponent(options.q).split('?')[1])
    } catch (e) {
      console.log(e)
    }
  }
  return (key) => {
    let value = null
    if (query[key]) {
      value = query[key]
    } else if (!key) {
      value = query
    } else {
      value = ''
    }
    return value
  }
}
onLoad(async function (options) {
  const queryValue = getQueryValue(options)
  console.log(queryValue())

  let { targetPath, ...query } = queryValue()

  try {
    targetPath = decodeURIComponent(targetPath)
  } catch (error) {
    console.log(error)
  }
  targetPath.indexOf('/') !== 0 && (targetPath = '/' + targetPath)

  navigator({ url: targetPath, query }, 'reLaunch')
})
</script>
