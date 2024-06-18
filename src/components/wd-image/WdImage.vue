<script setup lang="ts">
import { ref, useAttrs } from 'vue'

defineOptions({ name: 'WdImage' })

interface IProps {
  src: string
  mode?: string
  lazyLoad?: boolean
  fadeShow?: boolean
  webp?: boolean
  showMenuByLongpress?: boolean
  draggable?: boolean
}

const props: IProps = defineProps({
  src: { type: String, default: '', require: true },
  mode: { type: String, default: 'scaleToFill' },
  lazyLoad: { type: Boolean, default: false },
  fadeShow: { type: Boolean, default: true },
  webp: { type: Boolean, default: false },
  showMenuByLongpress: { type: Boolean, default: false },
  draggable: { type: Boolean, default: true },
})

const emits = defineEmits(['error'])

const isError = ref<boolean>(false)

const onError = (event) => {
  emits('error', event)
  isError.value = true
  console.log(event, props.src)
}
</script>

<template>
  <view class="relative w-full h-full text-30px">
    <image
      class="w-full h-full"
      :src="props.src"
      :mode="props.mode"
      :lazy-load="props.lazyLoad"
      :fade-show="props.fadeShow"
      :webp="props.webp"
      :show-menu-by-longpress="props.showMenuByLongpress"
      :draggable="props.draggable"
      @error="onError"
    />
    <view v-if="props.src == '' || isError" class="w-full h-full absolute top-0 left-0 z-1">
      <view class="i-uil-image-times text-1em text-gray-300"></view>
    </view>
  </view>
</template>
