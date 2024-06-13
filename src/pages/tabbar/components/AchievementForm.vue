<script setup>
import { onShow, onLoad } from '@dcloudio/uni-app'
import dayjs from 'dayjs'
import { computed, ref } from 'vue'

import { getBusinessReportForm } from '@/apis/work/'
import { useUserStore } from '@/store'
import { navigatorToH5 } from '@/utils/navigator'

const durationArr = [
  {
    id: 0,
    text: '今日',
    value: {
      startDate: dayjs().format('YYYY-MM-DD'),
      endDate: dayjs().format('YYYY-MM-DD'),
    },
  },
  {
    id: 1,
    text: '本周',
    value: {
      startDate: dayjs().startOf('week').add(1, 'day').format('YYYY-MM-DD'),
      endDate: dayjs().endOf('week').add(1, 'day').format('YYYY-MM-DD'),
    },
  },
  {
    id: 2,
    text: '本月',
    value: {
      startDate: dayjs().startOf('month').format('YYYY-MM-DD'),
      endDate: dayjs().endOf('month').format('YYYY-MM-DD'),
    },
  },
  {
    id: 3,
    text: '本年',
    value: {
      startDate: dayjs().startOf('year').format('YYYY-MM-DD'),
      endDate: dayjs().endOf('year').format('YYYY-MM-DD'),
    },
  },
]

const currentPower = ref(0)

const reportFormList = computed(() => {
  const list = [
    { text: '自然进店', value: '手工创建', key: 'inShopCus' },
    { text: '待跟进客户', value: '1', key: 'waitFollowCus' },
    { text: '跟进中客户', value: '2', key: 'followingCus' },
    { text: '成交客户', value: '3', key: 'successCus' },
    { text: '流失客户', value: '4', key: 'failCus' },
    { text: '退回客户', value: '5', key: 'returnCus' },
  ]

  return currentPower.value === 2
    ? list
    : [{ text: '待分配客户', value: '0', key: 'waitAllotCus' }, ...list]
})

const reportFormData = ref({
  waitAllotCus: 0, // 待分配客户数 （睡眠顾问不必关注此项）
  inShopCus: 0, // 自然进店数
  waitFollowCus: 0, // 待跟进客户数
  followingCus: 0, // 跟进中客户数
  successCus: 0, // 成交客户数
  failCus: 0, // 流失客户数
  returnCus: 0, // 退回客户数
})

const emits = defineEmits(['change'])

const active = ref(0)
const range = ref([])
const popupRef = ref(null)
const startDate = ref(dayjs().format('YYYY-MM-DD'))
const endDate = ref(dayjs().format('YYYY-MM-DD'))

// 获取招商数据报表
const getReportFormData = async ([startTime, endTime]) => {
  const { useUserInfoSync, useDealerInfoSync, useCurrentPositionSync } = useUserStore()
  const { userId } = await useUserInfoSync()
  const positionItem = await useCurrentPositionSync()
  console.log('positionItem', positionItem)
  const { shopCrmId } = await useDealerInfoSync()
  const { power = 0, shopId } = positionItem
  const userTypeList = ['BOSS', 'SHOP', 'MENTOR', 'DEALER']
  if (power > 3) return
  let params = { userType: userTypeList[power] }
  // 老板
  if (power === 0) {
    params = { ...params, bossId: shopCrmId }
  } else if (power === 1) {
    params = { ...params, shopId }
  } else if (power === 2) {
    params = { ...params, mentorUserId: userId, shopId }
  } else {
    // 主管
    params = { ...params, bossId: shopCrmId }
  }
  const { code, data } = await getBusinessReportForm({
    ...params,
    startTime,
    endTime,
  })
  if (code !== 0) return
  reportFormData.value = data
}

const onReportFormClick = async ({ detail }) => {
  const { index } = detail
  const item = reportFormList.value.find((option, i) => i === index)
  const [startTime, endTime] = [startDate.value, endDate.value]
  if (item.key === 'returnCus') {
    navigatorToH5({ path: '/businessBackList', query: { startTime, endTime, status: 2 } })
    return
  }
  const { useCurrentPositionSync } = useUserStore()
  const { power = 0, shopId } = await useCurrentPositionSync()
  const path = power === 2 ? '/businessList' : '/businessManage'
  const str = item.key === 'inShopCus' ? 'source' : 'status'
  navigatorToH5({
    path,
    query: { [str]: item.value, startTime, endTime, shopId },
  })
}

const onClick = (index) => {
  active.value = index
  if (index === 4) return
  const { value } = durationArr[index]
  startDate.value = value.startDate
  endDate.value = value.endDate
  getReportFormData([startDate.value, endDate.value])
}

const onPickerChange = (value) => {
  startDate.value = value[0]
  endDate.value = value[1]
  getReportFormData([startDate.value, endDate.value])
}

const init = async () => {
  const { useUserPowerSync } = useUserStore()
  currentPower.value = await useUserPowerSync()
  onClick(active.value)
}

onShow(init)

const openHelp = () => {
  popupRef.value?.open()
}

onLoad(() => {
  active.value = 0
})

defineExpose({ openHelp, init })
</script>

<template>
  <view>
    <view class="text-2 flex items-center justify-between p-2 text-sm text-gray-500">
      <text
        v-for="date in durationArr"
        :key="date.id"
        :class="{ active: active === date.id }"
        @click="onClick(date.id)"
      >
        {{ date.text }}
      </text>
      <view>
        <uni-datetime-picker v-model="range" type="daterange" @change="onPickerChange">
          <uni-icons
            class="calendar-icon"
            :color="active === 4 ? '#007aff' : '#6b7280'"
            type="calendar-filled"
            size="30"
            @click="onClick(4)"
          ></uni-icons>
        </uni-datetime-picker>
      </view>
    </view>
    <view class="my-2 px-2 text-xs text-theme-blue">
      <text>统计日期：{{ startDate }} ~ {{ endDate }}</text>
    </view>
    <uni-grid :column="4" :show-border="false" @change="onReportFormClick">
      <uni-grid-item
        v-for="(formItem, formIndex) in reportFormList"
        :key="formIndex"
        :index="formIndex"
      >
        <view class="text-center leading-10">
          <view>
            <text>{{ reportFormData[formItem.key] }}</text>
          </view>
          <view class="text-xs text-gray-500">{{ formItem.text }}</view>
        </view>
      </uni-grid-item>
    </uni-grid>
    <uni-popup ref="popupRef" type="center">
      <view class="flex justify-center text-sm">
        <view class="w-4/5 rounded-md bg-white p-4">
          <view>
            <text>帮助</text>
            <uni-icons type="help-filled" size="18"></uni-icons>
          </view>
          <view>
            <text class="help-title">进店数：</text>
            新增游客、客户数，按进店日期统计
          </view>
          <view>
            <text class="help-title">跟进客户：</text>
            按更新客户资料的时间点（编辑内容并点击保存按钮），进行数据统计
          </view>
          <view>
            <text class="help-title">成交客户：</text>
            按已成交订单（除取消状态）的建单时间，进行数据统计
          </view>
          <view>
            <text class="help-title">流失客户：</text>
            客户状态切换为已流失的时间点，进行数据统计
          </view>
          <view>
            <text class="help-title">成交订单：</text>
            已成交的订单数（除取消订单），按建单时间统计
          </view>
          <view>
            <text class="help-title">客单值：</text>
            成交订单总额 / 成交客户数
          </view>
          <view>
            <text class="help-title">成交率：</text>
            成交客户数 / 进店客户数
          </view>
          <view class="mt-2 text-xs text-gray-300">
            注：睡眠顾问、店长统计个人数据，经销商统计其所有门店数据。经销商、店长在“门店”模块查看各门店、各员工数据统计
          </view>
        </view>
      </view>
    </uni-popup>
  </view>
</template>

<style lang="scss" scoped>
.active {
  color: $uni-color-primary;
}
.help-title {
  display: block;
  margin-top: 20rpx;
  color: $uni-color-primary;
}
</style>
