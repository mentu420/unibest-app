<route lang="json5" type="home">
{
  style: {
    navigationStyle: 'custom',
    navigationBarTitleText: '工作台',
  },
}
</route>

<script setup lang="ts">
import { onShow, onShareAppMessage, onLoad } from '@dcloudio/uni-app'
import dayjs from 'dayjs'
import { Base64 } from 'js-base64'
import { ref, computed, onMounted, nextTick } from 'vue'

import { requestWechatToken } from '@/apis/common/auth'
import { getSysConfigList, getNoticeRecord, getSystemParamsByKeys } from '@/apis/common/system'
import { getLoginAccountId, saveUseAppRecord } from '@/apis/common/user'
import * as WorkApi from '@/apis/work/home'
// import AchievementForm from '@/components/common/AchievementForm.vue'
// import ExchangeSignDay from '@/components/common/ExchangeSignDay.vue'
import { getDealCategoryList } from '@/hooks/useGalleryProduct'
import { onLoginWithUserInfo } from '@/hooks/useLogin'
import useShareApp from '@/hooks/useShareApp'
import { useLocationStore, useMaterialStore, useUserStore } from '@/store'
import { showModal } from '@/utils/common'
import { navigator, navigatorToH5, logout } from '@/utils/navigator'
import { getStorage, setStorage } from '@/utils/storage'
import { StorageEnum } from '@/enums/storage'

const { useUserInfoSync, useDealerInfoSync, useGetToken, useUserPowerSync } = useUserStore()
const { getStaticResourceUrl } = useMaterialStore()

onShareAppMessage((options) => useShareApp.value)

interface IAchievemt {
  approvedCus: number
  closedCus: number
  countCus: number
  cusBusiness: number
  followCus: number
  guestSingleValue: number
  turnoverRatio: number
  volumeBusiness: number
}

interface IPlanItem {
  planName: string
  remark: string
}

const planList = ref<IPlanItem[]>([])
const achievementFormData = ref<IAchievemt>({
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
const feedbackInfo = ref({})
const navigatorList = ref([])
const authorizeRes = ref<any>(null)
const noticeMessage = ref(null)
const parentCodeList = ref<string[]>([])
const showPopup = ref(false)
const loading = ref(true)

// 是否显示菜单
const showMenu = computed(
  () =>
    (menuItem: {
      imageName?: string
      powers?: number[]
      permission?: number[]
      parentCodes?: string[]
    }) => {
      if (menuItem.imageName === 'pay') return true
      if (menuItem.powers) return menuItem.powers.includes(currentPower.value)
      if (menuItem.permission)
        return powers.value.some((item) => menuItem.permission.includes(item))
      if (menuItem.parentCodes)
        return parentCodeList.value.some((code: string) => menuItem.parentCodes.includes(code))
      return true
    },
)

const onAchievementChange = async <T,>(values: T) => {
  if (!useGetToken()) return
  const { userCrmId } = await useUserInfoSync()
  const { data } = await WorkApi.getWorkAchievement({ ...values, userCrmId }, { withUserId: true })

  achievementFormData.value = data as IAchievemt
}

const onCalenderChange = async (value: { selectedDate: string }) => {
  if (!useGetToken()) return
  planList.value = []
  const { data } = await WorkApi.getWorkPlan(
    {
      startDate: value.selectedDate,
      endDate: value.selectedDate,
    },
    { withUserId: true },
  )

  planList.value = (data as { dataList: IPlanItem[] }[])
    .map((item) =>
      (item.dataList as IPlanItem[]).map((option) => ({
        ...option,
        planName: Base64.decode(option.planName),
        remark: option.remark ? Base64.decode(option.remark) : '',
      })),
    )
    .flat()
}

interface INotice {
  systemReadNo?: number
  dealerReadNo?: number
  headquartersReadNo?: number
}

// 公告徽标
const useGetNoticeRecord = async () => {
  const { data } = await getNoticeRecord()

  const { systemReadNo = 0, dealerReadNo = 0, headquartersReadNo = 0 } = data as INotice
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
  const path = powers.some((item: number) => [0, 5].includes(item))
    ? '/diaryShopList'
    : '/diaryList'
  const query = powers.includes(5) ? { type: 'manager' } : {}
  navigatorToH5({ path, query })
}

const onGridClick = async <T,>(item: { imageName: string; path: string; query?: T }) => {
  if (item.imageName === 'pay') {
    // 跳转金蝶小程序
    const dealer = await useDealerInfoSync()
    if (!dealer) {
      showModal('经销商已经失效，该功能禁用')
      return
    }
    uni.navigateToMiniProgram({
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
const goPlanDetail = (item: { id: string }) => {
  navigatorToH5({
    path: '/workNewPlan',
    query: { type: 1, id: item.id },
  })
}

const getParentCodeList = async () => {
  const codeList = await getDealCategoryList()
  parentCodeList.value = [
    ...new Set(codeList.map((item: { parentCode: string }) => item.parentCode)),
  ] as string[]
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

  const keys = list.map((item: { value: string }) => `${str}${item.value}`).join(',')
  const { data } = await getSystemParamsByKeys({ keys })

  navigatorList.value = list.map((item: { value: string }) => {
    const res = data.find(
      (option: { paramKey: string }) => option.paramKey === `${str}${item.value}`,
    )
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
    const { data } = await getLoginAccountId()
    const [{ id }] = data as { id?: string }[]
    saveUseAppRecord({
      employeeId: id || '',
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
      const scopeUserLocation = getStorage(StorageEnum.SCOPE_USER_LOCATION)

      if (scopeUserLocation && dayjs(scopeUserLocation).add(7, 'day').isAfter(dayjs())) return
      // authorizeRes.value?.open()
      showLoaction.value = true
    }
  }
}

// 关闭定位授权弹框
const closeAuthorize = () => {
  // authorizeRes.value?.close()
  showLoaction.value = false
  setStorage(StorageEnum.SCOPE_USER_LOCATION, new Date().valueOf())
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
  const { list } = page as { list: any[] }
  if (code !== 0 || list.length === 0) return
  noticeMessage.value = list[0].paramValue
}

// 检测是否已经登录
const init = async () => {
  console.log('init')
  try {
    loading.value = true
    const tokenRes = useGetToken()
    console.log('tokenRes', tokenRes)
    if (tokenRes) {
      console.log(555555)
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

const showLoaction = ref(false)
</script>

<template>
  <view>工作台</view>
  <wd-popup v-model="showLoaction" position="bottom" @click-modal="closeAuthorize">
    <view>123</view>
  </wd-popup>
</template>
