<script setup>
import { useTouch } from '@/hooks/useTouch'
import useRect from '@/hooks/useRect'
import useWindowSize from '@/hooks/useWindowSize'

const isDef = (val) => val !== undefined && val !== null

const isNumeric = (val) => typeof val === 'number' || /^\d+(\.\d+)?$/.test(val)

function addUnit(value) {
  if (isDef(value)) {
    return isNumeric(value) ? `${value}px` : String(value)
  }
  return undefined
}

function closest(arr, target) {
  return arr.reduce((pre, cur) => (Math.abs(pre - target) < Math.abs(cur - target) ? pre : cur))
}

function pick(obj, keys, ignoreUndefined) {
  return keys.reduce((ret, key) => {
    if (!ignoreUndefined || obj[key] !== undefined) {
      ret[key] = obj[key]
    }
    return ret
  }, {})
}

const props = defineProps({
  gap: { type: Number, default: 24 },
  axis: { type: String, default: 'xy' },
  magnetic: { type: String, default: 'x' },
  icon: { type: String, default: '' },
  teleport: { type: String, default: '' },
  offset: {
    type: Object,
    default: () => ({ x: -1, y: -1 }),
  },
})

const emits = defineEmits(['click', 'update:offset', 'offsetChange'])

const rootRef = ref(null)
const state = ref({
  x: 0,
  y: 0,
  width: 0,
  height: 0,
})
const { windowWidth, windowHeight } = useWindowSize()
const boundary = computed(() => ({
  top: props.gap,
  right: windowWidth.value - state.value.width - props.gap,
  bottom: windowHeight.value - state.value.height - props.gap,
  left: props.gap,
}))

const dragging = ref(false)
let initialized = false

const rootStyle = computed(() => {
  const style = {}

  const x = addUnit(state.value.x)
  const y = addUnit(state.value.y)
  style.transform = `translate3d(${x}, ${y}, 0)`

  if (dragging.value || !initialized) {
    style.transition = 'none'
  }
  return style
})

const updateState = async () => {
  // onDeactivated with window size change will cause this
  if (!show.value) return

  const rect = await useRect('.root')
  const { width, height } = unref(rect)
  const { offset } = props
  state.value = {
    x: offset.x > -1 ? offset.x : windowWidth.value - width - props.gap,
    y: offset.y > -1 ? offset.y : windowHeight.value - height - props.gap,
    width,
    height,
  }
}

const touch = useTouch()
let prevX = 0
let prevY = 0

const onTouchStart = (e) => {
  console.log('event', e)
  touch.start(e)
  dragging.value = true

  prevX = state.value.x
  prevY = state.value.y
}

const onTouchMove = (e) => {
  e.preventDefault()

  touch.move(e)

  if (props.axis === 'lock') return

  if (!touch.isTap.value) {
    if (props.axis === 'x' || props.axis === 'xy') {
      let nextX = prevX + touch.deltaX.value
      if (nextX < boundary.value.left) nextX = boundary.value.left
      if (nextX > boundary.value.right) nextX = boundary.value.right
      state.value.x = nextX
    }

    if (props.axis === 'y' || props.axis === 'xy') {
      let nextY = prevY + touch.deltaY.value
      if (nextY < boundary.value.top) nextY = boundary.value.top
      if (nextY > boundary.value.bottom) nextY = boundary.value.bottom
      state.value.y = nextY
    }

    const offset = pick(state.value, ['x', 'y'])
    emits('update:offset', offset)
  }
}

const onTouchEnd = () => {
  dragging.value = false

  nextTick(() => {
    if (props.magnetic === 'x') {
      const nextX = closest([boundary.value.left, boundary.value.right], state.value.x)
      state.value.x = nextX
    }
    if (props.magnetic === 'y') {
      const nextY = closest([boundary.value.top, boundary.value.bottom], state.value.y)
      state.value.y = nextY
    }

    if (!touch.isTap.value) {
      const offset = pick(state.value, ['x', 'y'])
      emits('update:offset', offset)
      if (prevX !== offset.x || prevY !== offset.y) {
        emits('offsetChange', offset)
      }
    }
  })
}

const onClick = (e) => {
  if (touch.isTap.value) emits('click', e)
  else e.stopPropagation()
}

// useEventListener will set passive to `false` to eliminate the warning of Chrome
// useEventListener('touchmove', onTouchMove, { target: rootRef })

onMounted(() => {
  updateState()
  nextTick(() => {
    initialized = true
  })
})

watch([windowWidth, windowHeight, () => props.gap, () => props.offset], updateState, {
  deep: true,
})

const show = ref(true)

onActivated(() => {
  show.value = true
})

onDeactivated(() => {
  if (props.teleport) {
    show.value = false
  }
})
</script>

<template>
  <view
    v-show="show"
    ref="rootRef"
    class="fixed left-0 top-0 z-1000 root"
    :style="rootStyle"
    @touchstart="onTouchStart"
    @touchcancel="onTouchEnd"
    @touchend="onTouchEnd"
    @touchmove="onTouchMove"
    @click="onClick"
  >
    <slot></slot>
  </view>
</template>
