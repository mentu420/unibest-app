<route lang="json5" type="home">
{
  style: {
    navigationStyle: 'custom',
    navigationBarTitleText: '工作台',
  },
}
</route>

<script setup>
import { onShow, onShareAppMessage, onLoad } from '@dcloudio/uni-app'
import dayjs from 'dayjs'
import { ref, computed, onMounted, nextTick } from 'vue'

import { requestWechatToken } from '@/apis/common/auth'
import { getSysConfigList, getNoticeRecord, getSystemParamsByKeys } from '@/apis/common/system'
import { getLoginAccountId, saveUseAppRecord } from '@/apis/common/user'
import * as WorkApi from '@/apis/work/'
import AchievementForm from '@/components/common/AchievementForm.vue'
import ExchangeSignDay from '@/components/common/ExchangeSignDay.vue'
import { getDealCategoryList } from '@/hooks/useGalleryProduct'
import { onLoginWithUserInfo } from '@/hooks/useLogin'
import useShareApp from '@/hooks/useShareApp'
import { useLocationStore, useMaterialStore, useUserStore } from '@/store'
import { showModal } from '@/utils/common'
import { navigator, navigatorToH5, logout } from '@/utils/navigator'
import { getStorage, setStorage } from '@/utils/storage'

const { useUserInfoSync, useDealerInfoSync, useGetToken, useUserPowerSync } = useUserStore()
const { getStaticResourceUrl } = useMaterialStore()

onShareAppMessage((options) => useShareApp.value)

const planList = ref([])
const achievementFormData = ref({
  approvedCus: 0,
  closedCus: 0,
  countCus: 0,
  cusBusiness: 0,
  followCus: 0,
  guestSingleValue: 0,
  turnoverRatio: 0,
  volumeBusiness: 0,
})
const formRef = ref(null)
const noticeBadge = ref(0)
const powers = ref([4])
const currentPower = ref(4)
const navigatorList = ref([])
const authorizeRes = ref(null)
const noticeMessage = ref(null)
const parentCodeList = ref([])
const showPopup = ref(false)
const loading = ref(true)

// 是否显示菜单
const showMenu = computed(() => (menuItem) => {
  if (menuItem.imageName === 'pay') return true
  if (menuItem.powers) return menuItem.powers.includes(currentPower.value)
  if (menuItem.permission) return powers.value.some((item) => menuItem.permission.includes(item))
  if (menuItem.parentCodes)
    return parentCodeList.value.some((code) => menuItem.parentCodes.includes(code))
  return true
})

const onAchievementChange = async (values) => {
  if (!useGetToken()) return
  const { userCrmId } = await useUserInfoSync()
  const { data } = await WorkApi.getWorkAchievement({ ...values, userCrmId }, { withUserId: true })
  achievementFormData.value = data
}

const onCalenderChange = async ({ selectedDate }) => {
  if (!useGetToken()) return
  planList.value = []
  const { data } = await WorkApi.getWorkPlan(
    {
      startDate: selectedDate,
      endDate: selectedDate,
    },
    { withUserId: true },
  )
  planList.value = data
}
// 公告徽标
const useGetNoticeRecord = async () => {
  const { data } = await getNoticeRecord()
  const { systemReadNo = 0, dealerReadNo = 0, headquartersReadNo = 0 } = data
  noticeBadge.value = Number(systemReadNo) + Number(dealerReadNo) + Number(headquartersReadNo)
}
// 反馈建议徽标
const checkFeedbackReply = async () => {
  const { account } = await useUserInfoSync()
  const { data, msg } = await WorkApi.checkFeedbackReply(account)
  feedbackInfo.value = {
    isReply: data,
    reply: msg,
  }
}

const goDiary = async () => {
  const { powers } = await useUserInfoSync()
  const path = powers.some((item) => [0, 5].includes(item)) ? '/diaryShopList' : '/diaryList'
  const query = powers.includes(5) ? { type: 'manager' } : {}
  navigatorToH5({ path, query })
}

const onGridClick = async (item) => {
  if (item.imageName === 'pay') {
    // 跳转金蝶小程序
    const dealer = await useDealerInfoSync()
    if (!dealer) {
      showModal('经销商已经失效，该功能禁用')
      return
    }
    uni.navigatorMiniProgram({
      appId: import.meta.env.VITE_APP_JINDIE_APP_ID,
      path: 'page/tabBarManage/pages/wxLogin/wxLogin',
      extraData: {
        msCompanyNo: dealer?.dealerNo || 'D2999999',
        path: 'page/customerManage/pages/customer/index/customer',
      },
      envVersion: import.meta.env.MODE === 'production' ? 'release' : 'trial',
    })
  } else if (item.path === '/diaryShopList') {
    goDiary()
  } else if (item.path === '/verification') {
    navigator({ url: '/pages/work/verificationCode' })
  } else if (item.path === '/channelsLiveList') {
    const wechatToken = await requestWechatToken()
    navigatorToH5({ path: item.path, query: { openId: wechatToken?.openId } })
  } else {
    if (item.path === '') return
    navigatorToH5({ path: item.path, query: item.query })
  }
}

const addPlan = () => {
  navigatorToH5({ path: '/workNewPlan', query: { type: 0 } })
}
const goPlanDetail = (item) => {
  navigatorToH5({
    path: '/workNewPlan',
    query: { type: 1, id: item.id },
  })
}

const getParentCodeList = async () => {
  const codeList = await getDealCategoryList()
  parentCodeList.value = [...new Set(codeList.map((item) => item.parentCode))]
}

const setPower = async () => {
  const { primaryPositionId, positionList, ...res } = await useUserInfoSync()
  powers.value = res.powers
  currentPower.value = await useUserPowerSync()
  getParentCodeList()
}

const getNavigatorList = async () => {
  const params = { page: 1, limit: 1, sidx: 'paramsKey' }
  const str = 'MARKETING_WORK_MENU_'
  const { page } = await getSysConfigList({ ...params, paramKey: `${str}LIST` })
  const list = JSON.parse(page.list[0]?.paramValue ?? '[]')

  const keys = list.map((item) => `${str}${item.value}`).join(',')
  const { data } = await getSystemParamsByKeys({ keys })

  navigatorList.value = list.map((item) => {
    const res = data.find((option) => option.paramKey === `${str}${item.value}`)
    const menuList = JSON.parse(res?.paramValue ?? '[]')

    return { ...item, menuList }
  })
}

// 更新用户定位记录
const updateGeolocation = async () => {
  try {
    const { useAuthorize, getPosition } = useLocationStore()
    await useAuthorize()
    const geolocationRes = await getPosition()
    const { province, city, longitude, latitude } = geolocationRes
    const { data = [] } = await getLoginAccountId()
    saveUseAppRecord({
      employeeId: data[0]?.id || '',
      longitude,
      latitude,
      province,
      city,
      area: '',
      address: '',
    })
  } catch (error) {
    if (Object.prototype.toString.call(error) === '[object Object]') {
      if (!Object.keys(error).includes('scope.userLocation')) {
        closeAuthorize()
        return
      }
      const scopeUserLocation = getStorage('scopeUserLocation')

      if (scopeUserLocation && dayjs(scopeUserLocation).add(7, 'day').isAfter(dayjs())) return
      authorizeRes.value?.open()
    }
  }
}

// 关闭定位授权弹框
const closeAuthorize = () => {
  authorizeRes.value?.close()
  setStorage('scopeUserLocation', new Date().valueOf())
}

const onSettingBack = async () => {
  closeAuthorize()
  updateGeolocation()
}

// 获取滚动公告
const getScrollNotice = async () => {
  const { code, page } = await getSysConfigList({
    page: 1,
    limit: 1,
    paramKey: 'MARKETING_WORK_NOTICE',
    sidx: 'paramKey',
  })
  if (code !== 0 || page.list.length === 0) return
  noticeMessage.value = page.list[0].paramValue
}

// 检测是否已经登录
const init = async () => {
  console.log('init')
  try {
    loading.value = true
    const tokenRes = useGetToken()
    if (tokenRes) {
      const { account } = await useUserInfoSync()
      if (account !== '1000000') {
        await onLoginWithUserInfo(true)
      }
      await setPower()
      await getNavigatorList()
      useGetNoticeRecord()
      checkFeedbackReply()
      updateGeolocation()
      // getScrollNotice()
      return
    }
    logout()
  } catch (error) {
    logout()
  } finally {
    loading.value = false
  }
}

init()

onShow(async () => {
  if (loading.value) return
  await nextTick()
  await setPower()
  useGetNoticeRecord()
  checkFeedbackReply()
})
</script>

<template>
  <page-meta :page-style="'overflow:' + (showPopup ? 'hidden' : 'visible')">
    <uni-transition mode-class="fade" :show="loading">
      <view class="fixed bottom-0 left-0 right-0 top-0 z-10 overflow-hidden bg-white">
        <view v-if="noticeMessage" class="h-[40px] rounded-sm bg-[#f2f3f5]"></view>
        <view class="space-y-1 p-4">
          <view v-for="skeletonItem in [8, 4, 3, 3, 3]" :key="skeletonItem" class="px-[10px] py-4">
            <view class="mb-[24px] h-[24px] w-[120px] rounded-sm bg-[#f2f3f5]" />
            <view class="grid grid-cols-4 gap-4">
              <view v-for="skeletonOption in skeletonItem" :key="skeletonOption">
                <view class="mx-auto h-[40px] w-[40px] rounded-sm bg-[#f2f3f5]"></view>
                <view class="mt-[8px] h-[13px] rounded-sm bg-[#f2f3f5]" />
              </view>
            </view>
          </view>
        </view>
      </view>
    </uni-transition>
    <template v-if="!loading">
      <view class="sticky top-0 z-10">
        <uni-notice-bar
          v-if="noticeMessage"
          show-icon
          scrollable
          show-close
          :text="noticeMessage"
        />
      </view>
      <view class="min-h-screen bg-gray-100 p-2">
        <view
          v-for="navigatorItem in navigatorList"
          :key="navigatorItem.value"
          class="m-2 rounded-md bg-white px-[10px] py-[16px] shadow"
        >
          <view class="mb-[24px] text-[16px] text-[#333]">{{ navigatorItem.title }}</view>
          <view class="grid grid-cols-4 gap-4">
            <template v-for="menuItem in navigatorItem.menuList" :key="menuItem.imageName">
              <view
                v-if="showMenu(menuItem)"
                class="relative flex flex-col items-center justify-center text-center"
                @click="onGridClick(menuItem)"
              >
                <m-image
                  class="h-[40px] w-[40px]"
                  mode="aspectFit"
                  :src="getStaticResourceUrl(`work/${menuItem.imageName}`)"
                />
                <view
                  v-if="noticeBadge !== 0 && menuItem.path === '/noticeList'"
                  class="absolute -top-3 right-1"
                >
                  <uni-badge :text="noticeBadge" type="error" />
                </view>
                <text class="mt-[8px] text-[13px] leading-none text-[#999]">
                  {{ menuItem.label }}
                </text>
              </view>
            </template>
          </view>
        </view>
        <view class="m-2 rounded-md bg-white p-2 pt-4 shadow">
          <view class="mb-2 flex items-end px-1">
            <text class="text-[16px]">数据统计</text>
            <text class="text-xs text-gray-400">（订单一小时统计一次）</text>
          </view>
          <AchievementForm
            ref="formRef"
            :data="achievementFormData"
            @change="onAchievementChange"
          />
        </view>
        <view class="m-2 rounded-md bg-white p-2 shadow">
          <zsy-calendar mode="close" @change="onCalenderChange">
            <template #header="{ date }">
              <view class="flex justify-between p-2 pt-0 text-sm">
                <text>工作计划</text>
                <text>{{ date }}</text>
                <text class="text-theme-blue" @click="addPlan">添加计划</text>
              </view>
            </template>
          </zsy-calendar>
          <view class="text-center text-xs text-gray-300">点击日期查看工作计划，滑动切换日期</view>
        </view>
        <view
          v-for="item in planList"
          :key="item.id"
          class="m-2 overflow-hidden rounded-md bg-white p-2 shadow"
          @click="goPlanDetail(item)"
        >
          <uni-section title-font-size="16px" :title="item.planName">
            <template #right>
              <uni-icons type="forward" size="16"></uni-icons>
            </template>
          </uni-section>
          <view class="p-3 text-sm text-gray-500">
            <text>{{ item.remark }}</text>
          </view>
          <view class="p-2 pr-4 text-right text-xs text-theme-blue">
            <text>{{ item.startTime }} ~ {{ item.endTime }}</text>
          </view>
        </view>
      </view>
    </template>
  </page-meta>
  <ExchangeSignDay @change="({ show }) => (showPopup = show)" />
  <uni-popup ref="authorizeRes" type="bottom" background-color="#fff" @mask-click="closeAuthorize">
    <view class="space-y-4 bg-white p-4 text-[14px]">
      <view>
        <image
          class="h-[20px] w-[20px] rounded-full align-baseline"
          :src="getStaticResourceUrl('work/logo')"
        />
        <text class="mx-2">慕思营销助手</text>
        <text>申请</text>
      </view>
      <view class="space-y-1">
        <view>您未开启地理位置授权</view>
        <view class="text-gray-400">请在系统设置中打开位置授权，以便我们为您提供更好的服务。</view>
      </view>
    </view>
    <view class="text-center">
      <button
        class="!mr-2 !border-none !px-10 !text-[14px] !text-green-600"
        size="mini"
        @click="closeAuthorize"
      >
        拒绝
      </button>
      <button
        class="!ml-2 !border-none !px-10 !text-[14px]"
        size="mini"
        type="primary"
        open-type="openSetting"
        @opensetting="onSettingBack"
      >
        打开设置
      </button>
    </view>
  </uni-popup>
</template>
