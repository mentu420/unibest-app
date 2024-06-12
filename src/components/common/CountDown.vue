<script setup>
import { onShow } from '@dcloudio/uni-app'
import { ref, onActivated, useAttrs } from 'vue'

import { getStorage, setStorage, removeStorage } from '@/utils/storage'

const props = defineProps({
  format: {
    type: String,
    default: 'ss 秒重新获取',
  },
  request: {
    type: Function,
    default: () => {},
    require: true,
  },
  duration: {
    type: Number,
    default: 60,
  },
  cookieKey: {
    type: String,
    default: 'count-down-seconds',
  },
})
const attrs = useAttrs()
const countTime = ref(0)
const codeStatus = ref(0) // 0 未获取验证码  1 已经获取过验证码

const useCountDownTime = ({ key, duration = 60, seconds }) => {
  if (seconds) {
    setStorage(key, { time: new Date().getTime(), s: seconds })
  } else {
    const downTime = getStorage(key)
    if (!downTime) return 0
    removeStorage(key)
    const { time, s } = downTime
    const now = new Date().getTime()
    const timeDiff = (now - time) / 1000 // 时差 秒
    const result = timeDiff - duration >= 0 ? 0 : s - timeDiff
    return result
  }
}

const fetchDownCountTime = () => {
  const s = useCountDownTime({ key: props.cookieKey })
  countTime.value = Number(s)
  if (countTime.value > 0) codeStatus.value = 1
}

onShow(() => {
  fetchDownCountTime()
})

const onChange = () => {
  let timer = setInterval(() => {
    if (countTime.value === 0) {
      timer = null
      return
    }
    --countTime.value
    useCountDownTime({
      key: props.cookieKey,
      duration: props.duration,
      seconds: countTime.value,
    })
  }, 1000)
}

const onFinish = (value) => {
  countTime.value = 0
}

const sendSms = async () => {
  if (countTime.value > 0) return
  const { code } = await props.request()
  if (code !== 0) return
  countTime.value = props.duration
  codeStatus.value = 1
  onChange()
}
</script>

<template>
  <view class="btn-primary font-normal leading-none" @click="sendSms">
    <uni-countdown
      v-if="countTime > 0"
      :second="countTime"
      :show-day="false"
      color="#fff"
      splitor-color="#fff"
      @timeup="onFinish"
    ></uni-countdown>
    <label v-else class="lable">
      {{ codeStatus == 0 ? '发送验证码' : '重新获取' }}
    </label>
  </view>
</template>

<style lang="scss" scoped>
.lable {
  font-size: 24rpx;
}
</style>
