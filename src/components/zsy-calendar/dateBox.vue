<template>
  <!-- 日期显示 -->
  <view class="date_box">
    <view v-for="(dateInfo, dateIndex) in dates" :key="dateIndex" class="calendar_date__box">
      <view
        class="calendar_date"
        :class="{ isSelected: dateInfo.isSelected }"
        :style="itemStyles(dateInfo)"
        @tap="chooseDate(dateInfo, dateIndex)"
      >
        <view class="calendar_date__number">{{ dateInfo.date }}</view>
        <view
          v-if="dateInfo.isToday"
          class="calendar_date__isToday"
          :style="{ backgroundColor: dateActiveColor }"
        ></view>
        <view class="calendar_date__cricle"></view>
      </view>
    </view>
  </view>
</template>

<script>
export default {
  props: {
    dates: {
      type: Array,
      default: () => [],
    },
    cellHeight: {
      // 一列的高度
      type: Number,
      default: 75,
    },
    dateActiveColor: {
      // 日期选中颜色
      type: String,
      default: '#FE6601',
    },
    markColor: {
      // 日期标记颜色
      type: String,
      default: '#e5e5e5',
    },
    swiperMode: {
      // 日历显示模式
      type: String,
      default: 'open',
    },
    markDays: {
      type: Array,
      default: () => [],
    },
  },
  emits: ['chooseDate'],
  computed: {
    isMark() {
      return (item) => {
        return this.markDays.some((day) => {
          const date = new Date(day)
          return (
            item.type === 'cur' &&
            item.year === date.getFullYear() &&
            item.month === date.getMonth() + 1 &&
            item.date === date.getDate()
          )
        })
      }
    },
    itemStyles() {
      return (dateInfo) => ({
        height: this.cellHeight + 'rpx',
        width: this.cellHeight + 'rpx',
        color:
          this.swiperMode === 'open'
            ? dateInfo.type === 'cur'
              ? '#2C2C2C'
              : '#959595'
            : '#2C2C2C',
        backgroundColor: dateInfo.isSelected
          ? this.dateActiveColor
          : this.isMark(dateInfo)
            ? this.markColor
            : '',
      })
    },
  },
  methods: {
    chooseDate(dateInfo, dateIndex) {
      this.$emit('chooseDate', dateInfo, dateIndex)
    },
  },
}
</script>

<style>
/* 日历轮播 */
.date_box {
  display: flex;
  flex-wrap: wrap;
  justify-content: space-between;
}
.date_box .calendar_date__box {
  width: calc(100% / 7);
  margin-top: 20rpx;
}
.calendar_date__box .calendar_date {
  position: relative;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  margin: 0 auto;
  font-size: 28rpx;
  font-weight: bold;
  text-align: center;
  border-radius: 50%;
}
.calendar_date__box .calendar_date.isSelected {
  color: #ffffff !important;
}

.calendar_date .calendar_date__isToday {
  position: absolute;
  top: 0;
  left: 0;
  z-index: -1;
  width: 100%;
  height: 100%;
  border-radius: 50%;
  opacity: 0.4;
}
.calendar_date.dot .calendar_date__cricle {
  background-color: #007aff;
}
/* stylelint-disable-next-line no-descending-specificity */
.calendar_date .calendar_date__cricle {
  width: 9rpx;
  height: 9rpx;
  margin-top: 5rpx;
  background-color: #ffffff;
  border-radius: 50%;
}
.calendar_date__box .calendar_date.dot.isSelected .calendar_date__cricle {
  background-color: #ffffff;
}
</style>
