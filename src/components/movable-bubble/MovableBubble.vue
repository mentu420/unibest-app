<script setup>
import useRect from '@/hooks/useRect'
import { showModal } from '@/utils/common'

defineOptions({ name: 'MovableBubble' })

const x = ref(0)
const y = ref(0)
const bubbleRef = ref(null)
const bubbleRect = ref({})
const systemInfo = ref({})

// 默认定位右下角
const pos = ref({ x: 0, y: 0 })

const drag = ref(false)
const posStyles = computed(() => {
  return `left:${pos.value.x}px;top:${pos.value.y}px`
})

const onLongtap = async () => {
  if (drag.value) return
  // await showModal('进入拖拽模式')
  uni.showToast({ title: '进入拖拽模式', icon: 'none' })
  x.value = pos.value.x
  y.value = pos.value.y
  drag.value = true
}

const onStart = () => {
  console.log('onStart')
}

const onChange = ({ detail }) => {
  pos.value = detail
}

const onEnd = () => {
  setTimeout(() => (drag.value = false), 350)
}

onMounted(async () => {
  bubbleRect.value = await useRect('.bubble')
  uni.getSystemInfo({
    success: async (data) => {
      systemInfo.value = data
      const { windowWidth, windowHeight } = systemInfo.value
      pos.value = {
        x: windowWidth - bubbleRect.value.width,
        y: windowHeight - bubbleRect.value.height,
      }
    },
  })
})
</script>

<template>
  <view>
    <view
      v-if="!drag"
      ref="bubbleRef"
      class="fixed z-10 bubble bg-red"
      :style="posStyles"
      @longtap="onLongtap"
    >
      <slot>
        <view class="w-50px h-50px">表面元素</view>
      </slot>
    </view>
    <movable-area class="fixed left-0 top-0 z-12" :class="{ 'w-full h-full': drag }">
      <movable-view
        v-if="drag"
        :x="x"
        :y="y"
        class="bg-red"
        :style="`width:${bubbleRect.width}px;height:${bubbleRect.height}px`"
        direction="all"
        @touchstart="onStart"
        @change="onChange"
        @touchend="onEnd"
      >
        <slot>
          <view class="w-50px h-50px">滑动元素</view>
        </slot>
      </movable-view>
    </movable-area>
  </view>
</template>
