<route lang="json5" type="home">
{
  style: {
    navigationStyle: 'custom',
    navigationBarTitleText: '云学堂',
  },
}
</route>

<script setup>
import { onShow, onLoad, onPullDownRefresh, onShareAppMessage } from '@dcloudio/uni-app'
import dayjs, { extend } from 'dayjs'
import isSameOrAfter from 'dayjs/plugin/isSameOrAfter'
import isSameOrBefore from 'dayjs/plugin/isSameOrBefore'
import md5 from 'js-md5'
import qs from 'qs'
import { ref } from 'vue'
import EmptyCard from '@/components/layout/EmptyCard.vue'

import { getMaterialList, getSysConfigList } from '@/apis/common/system'
import {
  getHomeBanner,
  getStudyCategories,
  getTopRepositor,
  getLiveList,
  getReplayTopList,
  getSlideShowInfo,
} from '@/apis/study/'
import * as UserApi from '@/apis/common/user'
import useShareApp from '@/hooks/useShareApp'
import { useMaterialStore, useUserStore } from '@/store'
import { showModal } from '@/utils/common'
import { navigator, navigatorToH5 } from '@/utils/navigator'
import { getStorage, setStorage } from '@/utils/storage'

const { getStaticResourceUrl } = useMaterialStore()

extend(isSameOrBefore)
extend(isSameOrAfter)

onShareAppMessage((options) => useShareApp.value)

const TABS_LIST = [
  { text: '经典', classify: 2, parentCode: ['C'], brandCode: [] },
  { text: 'V6', classify: 3, parentCode: ['F'], brandCode: [] },
  {
    text: '慕思|CALIASOFART',
    classify: 4,
    parentCode: ['M'],
    brandCode: [],
  },
  { text: '慕思·羡慕', classify: 5, parentCode: ['M'], brandCode: [] },
]

const navIndex = ref(0)
// const barList = ref(['经典', 'V6'])
/**
 * app环境：根据账号判断是否具有tabs
 * 微信环境
 *    1：优家 没有账号，所以默认显示经典
 *    2：小程序 根据账号判断是否具有tabs
 * **/
const tabsList = ref([])
const bannerList = ref([]) // 轮播图
const gridList = ref([]) // 菜单
const articleList = ref([]) // 文章
const trainList = ref([]) // 培训
const trainBackList = ref([]) // 回放
const showTrain = ref(false)
const showEmpty = ref(true) // 是否有数据权限
const noticeImage = ref({}) // 云学堂弹窗图片信息
const noticeRef = ref(null)
const showPopup = ref(false)
const topMenu = ref([])
const loading = ref(true)

const getTopMenu = async () => {
  const {
    page: { list = [] },
  } = await getSysConfigList({
    page: 1,
    limit: 1,
    paramKey: 'MARKETING_STUDY_TOP_MENU',
    sidx: 'paramKey',
  })
  topMenu.value = JSON.parse(list[0].paramValue)
}

// 配置tabs
const setTabsList = async () => {
  try {
    const { useGetToken } = useUserStore()
    const { id } = useGetToken()
    const { code, data = [] } = await UserApi.getDealerBrandDetail({ userId: id })
    if (code !== 0 || !data || data.length === 0) {
      tabsList.value = []
      showEmpty.value = true
      return
    }
    showEmpty.value = false
    tabsList.value = TABS_LIST.filter((tab) => {
      if (tab.parentCode.length === 0) return true
      const bool = data.some((brand) => tab.parentCode.includes(brand.parentCode))
      if (bool && tab.brandCode.length === 0) return true
      return bool && data.some((brand) => tab.brandCode.includes(brand.brandCode))
    })
    if (tabsList.value !== 0) return
    tabsList.value = []
    showEmpty.value = true
  } catch (error) {
    console.log('showEmpty', error)
    // showEmpty.value = true
  }
}

const getBannerList = async () => {
  bannerList.value = await Promise.all(
    tabsList.value.map(async (item, i) => {
      const { code, data } = await getHomeBanner({ classify: item.classify })
      if (code !== 0) return
      return data
    }),
  )
}

const getGridList = async () => {
  gridList.value = await Promise.all(
    tabsList.value.map(async (item, i) => {
      let params = {
        classify: item.classify,
        page: 1,
        limit: 500,
      }
      params =
        item.classify === 2
          ? { ...params, level: 2, recommend: 1, orderType: 6 }
          : { ...params, level: 1, orderType: 2 }
      const { code, data } = await getStudyCategories(params)
      if (code !== 0) return
      if (item.classify === 2) {
        const arr = await Promise.all(
          [
            { imageName: 'answers', id: 0, name: '百问百答', classify: item.classify },
            { imageName: 'info', id: 2, name: '皮/布料信息库', classify: item.classify },
            { imageName: 'more', id: 1, name: '更多', classify: item.classify },
          ].map(async (item) => {
            const { data } = await getMaterialList({ name: item.imageName })
            if (data.length === 0) return item
            return { ...item, image: data[0]?.url }
          }),
        )
        return [...data.slice(0, 10), ...arr]
      } else {
        return data.slice(0, 8)
      }
    }),
  )
}

const getArticleList = async () => {
  const { useUserInfoSync } = useUserStore()
  const { account } = await useUserInfoSync()
  articleList.value = await Promise.all(
    tabsList.value.map(async (item, i) => {
      const { code, data } = await getTopRepositor({
        account,
        classify: item.classify,
      })
      if (code !== 0) return
      return data.slice(0, 2)
    }),
  )
}

const useGetLiveList = async () => {
  const { code, page } = await getLiveList({ page: 1, limit: 1 }, { withUserId: true })
  if (code !== 0) return
  trainList.value = page.list
}

const useGetLiveBackList = async () => {
  const { code, data } = await getReplayTopList()
  if (code !== 0) return
  trainBackList.value = data
}

const onBannerClick = (item) => {
  if (!item.url || item.url.replace(/\s+/g, '') === '') return
  if (/^\d{1,}$/.test(item.url)) {
    navigatorToH5({
      path: '/articleDetails',
      query: { id: item.url },
    })
    return
  }
  navigator({ url: item.url })
}

const onGridClick = (item = {}) => {
  const { id, classify, name } = item
  if ([0, 1, 2].includes(id)) {
    navigatorToH5({
      path: ['/studyClassify', '/policyNavList', '/inforDatabase'][id],
      query: { classify },
    })
    return
  }
  const path = classify === 2 ? '/studyArticleCategory' : '/policy'
  navigatorToH5({
    path,
    query: {
      id,
      name,
      classify,
      categoryId: id,
    },
  })
}

const goArticleDetail = (item) => {
  navigatorToH5({
    path: '/articleDetails',
    query: { id: item.id, classif: 2 },
  })
}

const goLiveDetail = (item) => {
  const { id, paymentFlag, userPaymentFlag, liveFlag } = item
  const showPay = paymentFlag && !userPaymentFlag && liveFlag === 2 ? 1 : 0
  navigatorToH5({
    path: '/studyLiveDetail',
    query: { id, showPay },
  })
}

const goLiveBackDetail = (item) => {
  const { historyId, paymentFlag, userPaymentFlag } = item
  if (!historyId || historyId === '') {
    showModal('该直播不存在')
    return
  }
  const showPay = paymentFlag && !userPaymentFlag ? 1 : 0
  navigatorToH5({
    path: '/studyLivePlayback',
    query: { id: historyId, showPay },
  })
}

const goSearch = () => {
  const { classify } = tabsList.value.find((item, index) => index === navIndex.value)
  navigatorToH5({
    path: '/articleSearch',
    query: {
      type: 'msIndex2',
      classify,
    },
  })
}

const goMenuItem = (item) => {
  console.log('item', item)
  if (item.imageName === 'corporation') {
    navigator({ url: item.path })
    return
  }

  const arr = item.path.split('?')
  const query = arr[1] ? qs.parse(arr[1]) : {}
  console.log('query', query)
  navigatorToH5({ path: arr[0], query })
}

const onTabClick = (tabIndex) => {
  navIndex.value = tabIndex
}

const onRefresh = () =>
  Promise.all([
    getBannerList(),
    getGridList(),
    getArticleList(),
    useGetLiveList(),
    useGetLiveBackList(),
  ])

// 检查云学堂弹窗
const getDialogImage = async () => {
  const date = getStorage('studyNoticeClose')
  if (date && dayjs().isSameOrBefore(date, 'day')) return
  const { data } = await getSlideShowInfo({
    pageSize: 500,
    currPage: 1,
    ascriptionModular: 401,
    associatedBusinessId: 401,
  })
  const list = data.filter((item) => item.effectiveState === 0)
  if (list.length === 0) return
  const { url, startShowTime, endShowTime } = list[0]
  // 小于startShowTime或者大于endShowTime
  if (dayjs().isSameOrBefore(startShowTime) || dayjs().isSameOrAfter(endShowTime)) return
  const { windowWidth, windowHeight } = await uni.getSystemInfoSync()
  noticeImage.value = {
    src: url,
    width: windowWidth * 0.8 + 'px',
    height: windowHeight * 0.8 + 'px',
  }
  noticeRef.value.open('center')
}

const onNoticeImageLoad = async ({ detail }) => {
  const { windowWidth, windowHeight } = await uni.getSystemInfoSync()
  const h = (detail.height / detail.width) * (windowWidth * 0.8)
  noticeImage.value = {
    ...noticeImage.value,
    height: (h > windowHeight * 0.8 ? windowHeight * 0.8 : h) + 'px',
  }
}

const onNoticeImageclose = () => {
  noticeRef.value.close()
  setStorage('studyNoticeClose', dayjs().format('YYYY-MM-DD HH:mm:ss'))
}

const init = async () => {
  await setTabsList()
  await onRefresh()
}

getTopMenu()
onShow(() => {
  if (loading.value) return
  init()
  getDialogImage()
})

onLoad(async () => {
  try {
    loading.value = true
    const { useUserInfoSync } = useUserStore()
    const { account } = await useUserInfoSync()
    showTrain.value = md5(account) === '8155bc545f84d9652f1012ef2bdfb6eb'
    getDialogImage()
    await init()
  } finally {
    loading.value = false
  }
})

onPullDownRefresh(async () => {
  await onRefresh()
  uni.stopPullDownRefresh()
})
</script>

<template>
  <page-meta :page-style="'overflow:' + (showPopup ? 'hidden' : 'visible')">
    <uni-transition mode-class="fade" :show="loading">
      <view class="bg-white px-4">
        <view class="my-2 h-[36px] w-full rounded-full bg-[#f2f3f5] p-4" />

        <view class="grid grid-cols-4 gap-4 pb-4">
          <view v-for="skeletonItem in 4" :key="skeletonItem">
            <view class="mx-auto h-[40px] w-[40px] rounded-sm bg-[#f2f3f5]"></view>
            <view class="mt-[8px] h-[13px] rounded-sm bg-[#f2f3f5]" />
          </view>
        </view>

        <view class="mt-2 flex items-center justify-around py-3">
          <view v-for="skeletonItem in 4" :key="skeletonItem">
            <view class="h-[30px] w-[40px] rounded-sm bg-[#f2f3f5]"></view>
          </view>
        </view>

        <view class="h-[160px] w-full rounded-lg bg-[#f2f3f5]" />

        <view class="grid grid-cols-4 gap-3 py-2">
          <view v-for="skeletonItem in 8" :key="skeletonItem">
            <view class="mx-auto h-[40px] w-[40px] rounded-sm bg-[#f2f3f5]"></view>
            <view class="mt-[8px] h-[13px] rounded-sm bg-[#f2f3f5]" />
          </view>
        </view>

        <view class="mt-2 flex items-center justify-between py-4">
          <view class="h-[24px] w-[72px] rounded-sm bg-[#f2f3f5]"></view>
          <view class="h-[16px] w-[66px] rounded-sm bg-[#f2f3f5]"></view>
        </view>

        <view class="h-[180px] w-full rounded-lg bg-[#f2f3f5]" />
      </view>
    </uni-transition>

    <uni-transition mode-class="fade" :show="!loading">
      <view>
        <EmptyCard v-if="showEmpty && showTrain" description="暂无数据" />
        <view v-else>
          <view v-if="tabsList.length > 0" @click="goSearch">
            <uni-search-bar
              radius="100"
              placeholder="请输入搜索关键词"
              cancel-button="none"
            ></uni-search-bar>
          </view>
          <view v-else class="h-3"></view>
          <view class="mb-3 grid grid-cols-4">
            <view
              v-for="(menuItem, menuIndex) in topMenu"
              :key="menuIndex"
              class="text-center"
              @click="goMenuItem(menuItem)"
            >
              <div class="flex items-center justify-center">
                <m-image
                  class="h-[40px] w-[40px]"
                  mode="aspectFit"
                  :src="getStaticResourceUrl(`study/${menuItem.imageName}`)"
                />
              </div>
              <p class="text-sm text-gray-500">{{ menuItem.text }}</p>
            </view>
          </view>
          <view class="h-2 bg-page-gray"></view>
          <view v-if="tabsList.length > 1" class="h-12 w-screen overflow-hidden">
            <view
              class="overflow-h-hidden no-scrollbar relative flex h-full overflow-x-auto pl-2 pr-2"
            >
              <view
                v-for="(tabItem, tabIndex) in tabsList"
                :key="tabItem.classify"
                class="relative flex flex-auto flex-shrink-0 items-center justify-center px-3 text-center leading-5"
                @click="onTabClick(tabIndex)"
              >
                <span :class="`text-md text-gray-${navIndex === tabIndex ? '900' : '500'}`">
                  {{ tabItem.text }}
                </span>
                <span
                  v-if="navIndex === tabIndex"
                  class="absolute bottom-1 h-1 w-8 rounded bg-blue-500"
                ></span>
              </view>
            </view>
          </view>
          <view>
            <view v-for="(tabItem, n) in tabsList" v-show="navIndex === n" :key="n">
              <view class="w-screen pt-2">
                <swiper
                  v-if="bannerList[n] && bannerList[n].length > 0"
                  class="swiper"
                  circular
                  autoplay
                  indicator-dots
                >
                  <swiper-item v-for="(item, i) in bannerList[n]" :key="i">
                    <view
                      class="mx-4 block h-full overflow-hidden rounded-2xl"
                      @click="onBannerClick(item)"
                    >
                      <m-image class="h-[159px] w-full" mode="aspectFill" :src="item.imgUrl" />
                    </view>
                  </swiper-item>
                </swiper>
                <view v-if="gridList[n]?.length > 0" class="flex flex-wrap justify-start py-1">
                  <view
                    v-for="(gridItem, i) in gridList[n]"
                    :key="i"
                    class="w-1/4"
                    @click="onGridClick(gridItem)"
                  >
                    <view class="flex h-full flex-col items-center justify-center p-1">
                      <m-image
                        class="h-[40px] w-[40px] overflow-hidden"
                        mode="aspectFit"
                        :src="gridItem.image"
                      />
                      <text class="w-20 truncate py-1 text-center text-xs text-gray-600">
                        {{ gridItem.name }}
                      </text>
                    </view>
                  </view>
                </view>

                <template v-if="articleList[n]?.length > 0">
                  <view class="h-2 bg-page-gray"></view>
                  <uni-section title="热门推荐" title-font-size="18px">
                    <template #right>
                      <label
                        @click="
                          navigatorToH5({
                            path: '/studyPushList',
                            query: { classify: tabItem.classify },
                          })
                        "
                      >
                        查看更多
                        <uni-icons type="forward" size="16"></uni-icons>
                      </label>
                    </template>
                  </uni-section>
                  <view class="px-4">
                    <view class="inline-grid grid-cols-2 gap-2">
                      <view
                        v-for="item in articleList[n]"
                        :key="item.id"
                        @click="goArticleDetail(item)"
                      >
                        <view class="h-[130px] w-full overflow-hidden rounded-md">
                          <m-image class="h-[130px] w-full" mode="aspectFill" :src="item.image" />
                        </view>
                        <view class="py-2 text-xs">
                          <text>{{ item.title }}</text>
                        </view>
                      </view>
                    </view>
                  </view>
                </template>
              </view>
            </view>
          </view>

          <view class="h-2 bg-page-gray"></view>
          <template v-if="!showTrain">
            <view class="flex items-center justify-between p-4">
              <view class="text-[18px]">在线培训</view>
              <view
                class="text-[12px] text-gray-500"
                @click="navigatorToH5({ path: '/studyLiveList', query: { index: 0 } })"
              >
                查看更多
                <uni-icons type="forward" size="14"></uni-icons>
              </view>
            </view>
            <view
              v-if="!!!trainList.length && !!!trainBackList.length"
              class="m-4 text-center text-sm text-gray-300"
            >
              暂无培训
            </view>
            <view v-for="item in trainList" :key="item.id" class="mx-4" @click="goLiveDetail(item)">
              <view>
                <view class="h-[180px] w-full overflow-hidden rounded-md">
                  <m-image class="h-[180px] w-full" mode="aspectFill" :src="item.roomPhoto" />
                </view>
                <view class="p-2">
                  <text>{{ item.title }}</text>
                  <view class="text-sm text-theme-yellow">
                    <label v-if="item.paymentFlag">￥</label>
                    <label v-if="item.paymentFlag">{{ item.paymentMoney }}</label>
                    <label v-else>免费</label>
                    <uni-icons v-if="item.password !== ''" type="locked" size="16"></uni-icons>
                    <span v-if="item.userPaymentFlag" class="train-item__status">已支付</span>
                  </view>
                </view>
              </view>
            </view>
            <view class="grid grid-cols-2 gap-4 px-4 pb-4">
              <view
                v-for="trainItem in trainBackList"
                :key="trainItem.id"
                class="pr-2"
                @click="goLiveBackDetail(trainItem)"
              >
                <view class="h-full w-full overflow-hidden rounded-md">
                  <m-image class="h-full w-full" mode="aspectFill" :src="trainItem.roomPhoto" />
                </view>
                <view class="p-2" style="width: 310rpx">
                  <text class="text-sm">{{ trainItem.title }}</text>
                  <view v-if="trainItem.paymentFlag === 1">
                    <text>￥{{ trainItem.paymentMoney }}</text>
                    <uni-tag
                      v-if="trainItem.userPaymentFlag"
                      type="warning"
                      circle
                      inverted
                      text="已付款"
                    />
                  </view>
                </view>
              </view>
            </view>
          </template>
        </view>
      </view>
    </uni-transition>
  </page-meta>
  <uni-popup
    ref="noticeRef"
    lock-scroll
    closeable
    close-icon="clear"
    style="background: transparent"
    teleport="body"
    @change="({ show }) => (showPopup = show)"
  >
    <view class="flex h-[80vh] w-[80vw] items-center justify-center">
      <view class="relative h-full w-full overflow-hidden rounded-lg">
        <m-image
          mode="aspectFit"
          class="h-full w-[80vw]"
          :height="noticeImage.height"
          :src="noticeImage.src"
          @load="onNoticeImageLoad"
        />
        <uni-icons
          class="absolute right-2 top-2 z-10 shadow"
          type="clear"
          color="#fff"
          size="36"
          @click.stop="onNoticeImageclose"
        ></uni-icons>
      </view>
    </view>
  </uni-popup>
</template>

<style lang="scss" scoped>
.swiper {
  height: 318rpx;
}

.scroll-warp {
  width: 100vw;
  padding-bottom: 32rpx;
  padding-left: 32rpx;
  overflow-x: scroll;
  &::-webkit-scrollbar {
    display: none;
  }
}
</style>
