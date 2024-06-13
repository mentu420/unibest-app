<script setup>
import { computed, ref, useAttrs, watch } from 'vue'

import EmptyCard from './EmptyCard.vue'

const props = defineProps({
  totalPage: {
    type: Number,
    default: 0,
  },
  loading: {
    type: Boolean,
    default: false,
  },
  finished: {
    type: Boolean,
    default: false,
  },
})

const attrs = useAttrs()

const empty = ref({ description: '暂无数据' })

const showEmpty = ref(true)

watch(
  () => props.totalPage,
  (val) => {
    showEmpty.value = val === 0
  },
  { immediate: true },
)

// more  loading  noMore
const status = computed(() => {
  if (props.finished) {
    return 'noMore'
  }
  return props.loading ? 'loading' : 'more'
})
</script>

<template>
  <view>
    <EmptyCard v-if="showEmpty" v-bind="{ ...empty, ...attrs }" />
    <uni-load-more v-else :status="status" />
  </view>
</template>
