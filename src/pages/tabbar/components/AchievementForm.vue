<script setup lang="ts">
import { onShow, onLoad } from '@dcloudio/uni-app'
import dayjs from 'dayjs'
import { computed, ref } from 'vue'

import { getBusinessReportForm } from '@/apis/work/home'
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

interface IReportFormData {
  waitAllotCus: number // 待分配客户数 （睡眠顾问不必关注此项）
  inShopCus: number // 自然进店数
  waitFollowCus: number // 待跟进客户数
  followingCus: number // 跟进中客户数
  successCus: number // 成交客户数
  failCus: number // 流失客户数
  returnCus: number // 退回客户数
}

const reportFormList = computed<{ text: string; value: string; key: string }[]>(() => {
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

const reportFormData = ref<IReportFormData>({
  waitAllotCus: 0, // 待分配客户数 （睡眠顾问不必关注此项）
  inShopCus: 0, // 自然进店数
  waitFollowCus: 0, // 待跟进客户数
  followingCus: 0, // 跟进中客户数
  successCus: 0, // 成交客户数
  failCus: 0, // 流失客户数
  returnCus: 0, // 退回客户数
})

const emits = defineEmits(['change'])

type TDateString = Date | string

const active = ref(0)
const range = ref([])
const startDate = ref<TDateString>(dayjs().format('YYYY-MM-DD'))
const endDate = ref<TDateString>(dayjs().format('YYYY-MM-DD'))

interface IParams {
  userType: string
  bossId?: string
  shopId?: string
  mentorUserId?: string
}

// 获取招商数据报表
const getReportFormData = async ([startTime, endTime]: [
  TDateString,
  TDateString,
]): Promise<any> => {
  const { useUserInfoSync, useDealerInfoSync, useCurrentPositionSync } = useUserStore()
  const { userId } = await useUserInfoSync()
  const positionItem = await useCurrentPositionSync()
  console.log('positionItem', positionItem)
  const { shopCrmId } = await useDealerInfoSync()
  const { power = 0, shopId } = positionItem
  const userTypeList = ['BOSS', 'SHOP', 'MENTOR', 'DEALER']
  if (power > 3) return
  let params: IParams = { userType: userTypeList[power] }
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
  reportFormData.value = data as IReportFormData
}

const onReportFormClick = async (index: number) => {
  const item = reportFormList.value.find((option, i) => i === index)
  if (!item) return
  const [startTime, endTime] = [startDate.value, endDate.value]
  if (item?.key === 'returnCus') {
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

const onClick = (index: number) => {
  active.value = index
  if (index === 4) return
  const { value } = durationArr[index]
  startDate.value = value.startDate
  endDate.value = value.endDate
  getReportFormData([startDate.value, endDate.value])
}

const onPickerChange = (value: TDateString[]) => {
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

onLoad(() => {
  active.value = 0
})

defineExpose({ init })
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
    <view class="mb-4 grid grid-cols-4 gap-2">
      <view
        v-for="(formItem, formIndex) in reportFormList"
        :key="formIndex"
        :index="formIndex"
        @click="onReportFormClick(formIndex)"
      >
        <view class="text-center leading-10">
          <view>
            <text class="font-blod">{{ reportFormData[formItem.key] }}</text>
          </view>
          <view class="text-xs text-gray-500">{{ formItem.text }}</view>
        </view>
      </view>
    </view>
  </view>
</template>
