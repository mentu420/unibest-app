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
    navigationBarTitleText: '营销助手',
  },
}
</route>

<script setup>
import { onLoad, onShow, onUnload, onBackPress, onShareAppMessage } from '@dcloudio/uni-app'
import qs from 'qs'
import { ref } from 'vue'

import { setExchangeSign, isAlreadySigned } from '@/hooks/useExchangeSign'
import useShareApp from '@/hooks/useShareApp'
import { showModal, getUrlQueryItem, throttle } from '@/utils/common'
import { useUserStore } from '@/store'
import logger from '@/utils/logger'

const url = ref(null)
const shareConfig = ref({})
const wvStyles = ref({
  progress: {
    color: '#007aff',
  },
})

// 设置webview url
const setWebviewUrl = (options) => {
  console.log('setWebviewUrl', options)
  let tempUrl = decodeURIComponent(options.url)
  try {
    tempUrl = JSON.parse(tempUrl)
  } catch (error) {
    console.warn(error)
  }
  Object.keys(options)
    .filter((item) => item !== 'url')
    .forEach((item) => {
      tempUrl += (tempUrl.indexOf('?') !== -1 ? '&' : '?') + item + '=' + options[item]
    })
  console.log(tempUrl)
  url.value = tempUrl
}
// 设置webview样式
const setWebviewStyle = (bool = false) => {
  // #ifdef APP-PLUS
  uni.getSystemInfo({
    // 获取当前设备的具体信息
    success: (sysinfo) => {
      wvStyles.value = {
        ...wvStyles.value,
        // 设置web-view距离顶部的距离以及自己的高度，单位为px
        top: bool ? 0 : sysinfo.statusBarHeight, // 此处是距离顶部的高度，应该是你页面的头部
        height: bool ? sysinfo.windowHeight : sysinfo.windowHeight - sysinfo.statusBarHeight, // webview的高度
        // height: 300, //webview的高度
      }
    },
  })
  // #endif
}
// 旋转屏幕
const setAppScreenOrientation = (value) => {
  // #ifdef APP-PLUS
  const origin = value ? 'landscape-primary' : 'portrait-primary'
  plus.navigator.setFullscreen(value)
  plus.screen.lockOrientation(origin) // 旋转屏幕
  setWebviewStyle(value)
  // #endif
}

const hideHomeButton = (url = '') => {
  const str = url.split('?')[1]
  const { isShare } = qs.parse(str)
  if (!isShare) return
  uni.hideHomeButton()
}

const onPlusGestureBack = () => {
  // #ifdef APP-PLUS
  const pages = getCurrentPages()
  const page = pages[pages.length - 1]
  const currentWebview = page.$getAppWebview()
  let reloadView = null
  const backRouter = throttle(
    (e) => {
      reloadView.back()
    },
    2000,
    {
      trailing: false,
    },
  )
  setTimeout(() => {
    reloadView = currentWebview.children()[0]
    reloadView.drag(
      {
        direction: 'right',
        moveMode: 'silent',
      },
      {
        view: 'nullView',
        moveMode: 'follow',
      },
      (e) => {
        if (e.type === 'end') {
          backRouter(e)
        }
      },
    )
  }, 1000)
  // #endif
}

onBackPress((e) => {
  const pages = getCurrentPages()
  const page = pages[pages.length - 1]
  const currentWebview = page.$getAppWebview()
  currentWebview.children()[0].back()
  return true
})

const onPlusCreateWv = (url) => {
  // #ifdef APP-PLUS
  const wv = plus.webview.create('', 'custom-webview', {
    plusrequire: 'none', // 禁止远程网页使用plus的API，有些使用mui制作的网页可能会监听plus.key，造成关闭页面混乱，可以通过这种方式禁止
    'uni-app': 'none', // 不加载uni-app渲染层框架，避免样式冲突
    top: uni.getSystemInfoSync().statusBarHeight,
  })
  wv.loadURL(url)
  const pages = getCurrentPages()
  const page = pages[pages.length - 1]
  const currentWebview = page.$getAppWebview() // 此对象相当于html5plus里的plus.webview.currentWebview()。在uni-app里vue页面直接使用plus.webview.currentWebview()无效
  currentWebview.append(wv) // 一定要append到当前的页面里！！！才能跟随当前页面一起做动画，一起关闭
  // #endif
}

onLoad((options) => {
  setWebviewUrl(options)
  setWebviewStyle()
  hideHomeButton(options.url)
  // onPopGesture()
})

// 页面卸载时切换为竖屏配置
onUnload(() => {
  setAppScreenOrientation(false) // 锁死屏幕方向为竖屏
})

// 监听h5传递过来的信息
const onMessage = (event) => {
  const { useSetToken } = useUserStore()
  const { detail } = event
  const length = detail.data.length
  const messageResult = detail.data[length - 1] || {}
  switch (messageResult.type) {
    case 'miniprogramShare': // 微信分享
      console.log('shareConfig', messageResult.shareConfig)
      shareConfig.value = messageResult.shareConfig
      break
    case 'plusWxShare': // app 微信分享
      uni.share({
        ...messageResult.shareConfig,
        fail: (err) => {
          console.error(err)
        },
      })
      break
    case 'plusWxPay': // app 微信支付
      uni.requestPayment({
        provider: 'wxpay',
        orderInfo: messageResult.orderInfo,
        success(res) {},
        fail(e) {
          console.error('支付失败：' + e)
        },
      })
      break
    case 'plusNavigateTo': // app 跳转
      navigateTo({
        url: messageResult.url,
      })
      break

    case 'plusScreenLandscape': // app锁死屏幕方向为横屏
      setAppScreenOrientation(true)
      break
    case 'plusScreenPortrait':
      setAppScreenOrientation(false) // app锁死屏幕方向为竖屏
      break
    case 'updateToken':
      console.log('updateToken', messageResult)
      messageResult.data && useSetToken(messageResult.data)
      break
    default:
      break
  }
}

const onArticleShareSign = async (url) => {
  const arr = url.split('?')[0].split('/')
  if (arr[arr.length - 1] !== 'articleDetails') return
  const hasShare = getUrlQueryItem('hasShare', url)
  if (hasShare === '0') return // 没有分享功能 不记录积分行为
  const target = getUrlQueryItem('id', url)
  const behaviorId = 10105
  const bool = await isAlreadySigned({ behaviorId, target })
  if (bool) return
  const data = await setExchangeSign({ behaviorId, target })
  if (!data) return
  showModal(`成功获得${data.points}积分`)
}

uni.onError((err) => {
  logger.error(`加载失败${err ? JSON.stringify(err) : ''},请删除小程序重新搜索使用！`)
})

// 小程序配置分享
onShareAppMessage((options) => {
  console.log('shareConfig', shareConfig.value)
  const { title, imageUrl, desc, shareUrl } = shareConfig.value
  if (shareUrl) onArticleShareSign(shareUrl)
  const path = `/pages/common/webviewPage?url=${encodeURIComponent(JSON.stringify(shareUrl))}`
  return shareUrl ? { title, imageUrl, desc, path } : useShareApp.value
})
</script>

<template>
  <web-view
    v-if="url"
    :src="url"
    :webview-styles="wvStyles"
    @message="onMessage"
    @error="onError"
  />
</template>
