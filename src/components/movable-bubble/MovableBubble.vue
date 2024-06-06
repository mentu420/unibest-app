<script setup>
import { ref, onMounted } from 'vue'
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
const posStyles = computed(() => `left:${pos.value.x}px;top:${pos.value.y}px`)

const onStart = async () => {
  await showModal('进入拖拽模式')
  x.value = pos.value.x
  y.value = pos.value.y
  drag.value = true
}

const onChange = ({ detail }) => {
  pos.value = detail
}

const onEnd = () => {
  drag.value = false
}

onMounted(async () => {
  bubbleRect.value = await useRect('.bubble')
  uni.getSystemInfo({
    success: (data) => {
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
      class="fixed bg-red z-10 bubble"
      :style="posStyles"
      @longtap="onStart"
    >
      <slot>
        <text>表面元素</text>
      </slot>
    </view>
    <movable-area
      class="fixed left-0 top-0"
      :class="{ 'w-full h-full bg-gray-200 bg-opacity-80': drag }"
    >
      <movable-view
        v-if="drag"
        :x="x"
        :y="y"
        class="bg-red"
        :style="`width:${bubbleRect.width}px;height:${bubbleRect.height}px`"
        direction="all"
        @change="onChange"
        @touchend="onEnd"
      >
        <slot>
          <text>滑动元素</text>
        </slot>
      </movable-view>
    </movable-area>
  </view>
</template>
