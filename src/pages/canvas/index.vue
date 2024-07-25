<route lang="json5" type="home">
{
  style: {
    navigationStyle: 'custom',
    navigationBarTitleText: '首页',
  },
}
</route>

<script setup>
import { showModal } from '@/utils/common'
import FloatingBubble from '@/components/movable-bubble/FloatingBubble.vue'

const canvasHeight = ref(300)
const canvasWidth = ref(0)

function getSystemInfo() {
  return new Promise((resolve) => {
    uni.getSystemInfo({
      success: resolve,
    })
  })
}

function getImageInfo(src) {
  return new Promise((resolve, reject) => {
    uni.getImageInfo({
      src,
      success: resolve,
      fail: reject,
    })
  })
}

const drawCanvas = async () => {
  const ctx = uni.createCanvasContext('myCanvas')
  const images = [
    'https://derucci-app-test-obs.iderucci.com/consumer-admin-derucci/fast-pass/35f3c2f367ef396278f16dcfc319f009/MjAyNDA2MjQlRTYlQjUlQjclRTYlOEElQTUtJUU3JUFFJTgwJUU2JUI0JTgxJUU3JTg5JTg4LjE3MTk1NDU2Njc0MzY=.jpg',
    'https://derucci-app-test-obs.iderucci.com/consumer-admin-derucci/fast-pass/64d5a549a053ac606da2f322edc47658/MDEuMTcwMzU2MTk4NTc1OA==.jpg',
  ]

  const [image1, image2] = await Promise.all(images.map(async (src) => await getImageInfo(src)))
  console.log('object', image1, image2)

  const systemInfo = await getSystemInfo()
  canvasWidth.value = systemInfo.windowWidth
  const image1H = (canvasWidth.value / image1.width) * image1.height
  const image2H = (canvasWidth.value / image2.width) * image2.height
  console.log(image1H, image2H)
  canvasHeight.value = image1H + image2H + 50 // 增加高度以容纳文本

  // 绘制图片1
  ctx.drawImage(image1.path, 0, 0, canvasWidth.value, image1H)

  // 绘制图片2，拼接在图片1下方
  ctx.drawImage(image2.path, 0, image1H + 25, canvasWidth.value, image2H)

  // // 添加文字
  ctx.setFontSize(16)
  ctx.setFillStyle('#000') // 文字颜色
  ctx.setTextAlign('center')
  ctx.fillText('这是第一张图片', canvasWidth.value / 2, image1H + 20)
  ctx.setTextAlign('left')
  ctx.fillText('这是第二张图片', 10, image1H + image2H + 45)

  ctx.draw()
}

const getAuthorize = () => {
  return new Promise((resolve, reject) => {
    uni.authorize({
      scope: 'scope.writePhotosAlbum',
      success: resolve,
      fail: reject,
    })
  })
}

getAuthorize()

/**
 * 获取用户是否授权，没有授权打开设置
 * @params scopes 授权列表 //https://developers.weixin.qq.com/miniprogram/dev/framework/open-ability/authorize.html
 * **/
function getAuthSetting(scopes, withSubscriptions = false) {
  scopes = Array.isArray(scopes) ? scopes : [scopes]
  return new Promise((resolve, reject) => {
    uni.getSetting({
      withSubscriptions,
      success(res) {
        const { authSetting } = res
        console.log('authSetting', authSetting)
        console.log(scopes.every((scope) => !authSetting[scope]))
        if (!scopes.every((scope) => !authSetting[scope])) {
          resolve(res)
          return
        }
        uni.openSetting({
          success(settingdata) {
            if (!scopes.every((scope) => !settingdata.authSetting[scope])) {
              showModal('授权成功，请重新操作')
            } else {
              showModal('授权失败')
            }
          },
          fail: reject,
        })
      },
      fail: reject,
    })
  })
}

async function saveCanvas() {
  await getAuthSetting('scope.writePhotosAlbum')
  uni.canvasToTempFilePath({
    canvasId: 'myCanvas',
    success: (res) => {
      const tempFilePath = res.tempFilePath
      uni.saveImageToPhotosAlbum({
        filePath: tempFilePath,
        success: () => {
          showModal('保存成功')
        },
      })
    },
    fail: (err) => {
      console.error('生成图片失败', err)
    },
  })
}

onReady(() => {
  drawCanvas()
})
</script>

<template>
  <view>
    <canvas
      canvas-id="myCanvas"
      id="myCanvas"
      class="w-full"
      :style="`height:${canvasHeight}px`"
    ></canvas>
    {{ canvasHeight }}
    <view class="p-4 safe-pb-2">
      <button class="btn-primary" @click="saveCanvas">保存图片到本地</button>
    </view>
    <FloatingBubble>
      <view class="w-50px h-50px bg-fuchsia rounded-full">555</view>
    </FloatingBubble>
  </view>
</template>
