<script>
import emptyCoupon from './images/empty-image-coupon.png'
import emptyDefault from './images/empty-image-default.png'
import emptyError from './images/empty-image-error.png'
import emptyNetwork from './images/empty-image-network.png'
import emptySearch from './images/empty-image-search.png'
import { computed } from 'vue'

export default {
  name: 'MEmpty',
  props: {
    image: {
      type: String,
      default: 'default',
    },
    description: {
      type: String,
      default: '',
    },
  },
  setup(props, { attrs, slots, emit }) {
    const src = computed(() => {
      const images = {
        default: emptyDefault,
        error: emptyError,
        search: emptySearch,
        network: emptyNetwork,
        coupon: emptyCoupon,
      }
      if (images[props.image]) {
        return images[props.image]
      }
      return props.image
    })

    return {
      src,
    }
  },
}
</script>

<template>
  <view class="empty">
    <view class="empty-image">
      <image class="image" mode="aspectFit" :src="src" />
    </view>
    <text>{{ description }}</text>
  </view>
</template>

<style lang="scss" scoped>
.empty {
  flex: 1;
  padding: 10rpx 0;
  font-size: 28rpx;
  color: #363636;
  text-align: center;
  .empty-image {
    display: flex;
    justify-content: center;
    .image {
      width: 426rpx;
      height: 320rpx;
    }
  }
}
</style>
