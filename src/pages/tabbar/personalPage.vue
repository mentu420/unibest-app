<route lang="json5" type="home">
{
  style: {
    navigationStyle: 'custom',
    navigationBarTitleText: '个人',
  },
}
</route>

<script setup>
import { onShow, onShareAppMessage, onLoad } from '@dcloudio/uni-app'
import { storeToRefs } from 'pinia'
import { ref, reactive, computed, nextTick } from 'vue'

import { updateUserInfo, getAppVersion, getCredentials, getP3Detail } from '@/apis/common/user'
import ExchangeSignCard from '@/components/common/ExchangeSignCard.vue'
import useShareApp from '@/hooks/useShareApp'
import { useMaterialStore, useUserStore } from '@/store'
import { showModal, scanCode } from '@/utils/common'
import { navigator, navigatorToH5, logout } from '@/utils/navigator'
import { getStorage } from '@/utils/storage.js'
import { getSystemParamsByKeys } from '@/apis/common/system'

onShareAppMessage((options) => useShareApp.value)

const { getStaticResourceUrl } = useMaterialStore()

const popupRef = ref(null)
const role = ref('') // 当前角色postionId
const positionName = ref('')
const shopName = ref('')
const version = ref('1.0.0')
const appVerson = ref(import.meta.env.VITE_APP_VERSION)
const roleList = ref([])
const { userInfo } = storeToRefs(useUserStore())
const isAvatarError = ref(false)
const loading = ref(true)
const showSkeletion = ref(false)
const menuList = ref([])

const avatarIcon = computed(() => {
  const { headPortrait = '' } = userInfo.value || {}
  if (headPortrait !== '') return headPortrait
  return getStaticResourceUrl('me/avatar-icon')
})

const account = computed(() => {
  return getStorage('account') || userInfo.value?.account
})

const getNavigatorList = async () => {
  const keys = ['MARKETING_PERSONAL_MENU_1', 'MARKETING_PERSONAL_MENU_2']
  const { data } = await getSystemParamsByKeys({ keys: keys.join(',') })
  menuList.value = data.map((item) => JSON.parse(item?.paramValue ?? '[]'))
}

const onPositionChange = async (item, option) => {
  const { useUserInfoSync } = useUserStore()
  role.value = option.positionId
  positionName.value = option.positionName
  shopName.value = item.shopName
  await updateUserInfo({ primaryPositionId: option.positionId })
  useUserInfoSync({ reload: true })
  popupRef.value.close()
}

const onLogout = async () => {
  try {
    loading.value = true
    await showModal('是否退出?', { showCancel: true })
    await logout()
  } finally {
    loading.value = false
  }
}

const openScan = async () => {
  const res = await scanCode()
  navigator({ url: '/pages/personal/personalCertification', query: { code: res.result } })
}

const useNavigtorH5 = async (item) => {
  if (item.path === '/personalWallet') {
    navigator({ url: '/pages/personal/personalWallet' })
    return
  }
  navigatorToH5({ path: item.path })
}

const useSetVersion = async () => {
  const { code, page } = await getAppVersion({ type: '营销助手app', page: 1, limit: 1 })
  if (code !== 0) return
  version.value = page.list[0].title
}

const updatePosition = async () => {
  useSetVersion()
  const { useRoleListSync, useCurrentPositionSync } = useUserStore()
  const powerItem = await useCurrentPositionSync()
  role.value = powerItem?.positionId
  positionName.value = powerItem?.typeName
  shopName.value = powerItem?.shopName
  roleList.value = await useRoleListSync({ reload: true })
}

const init = async () => {
  try {
    loading.value = true
    showSkeletion.value = true
    await updatePosition()
    await getNavigatorList()
  } finally {
    loading.value = false
    showSkeletion.value = false
  }
}

init()

onShow(() => {
  if (loading.value) return
  updatePosition()
})
</script>

<template>
  <view class="min-h-screen bg-page-gray">
    <uni-transition mode-class="fade" :show="showSkeletion">
      <view class="bg-white p-4">
        <ul class="flex justify-between pt-4">
          <li class="flex">
            <div class="h-[52px] w-[52px] rounded-full bg-[#f2f3f5]"></div>
            <div class="ml-2 space-y-2">
              <view class="h-[24px] w-[120px] rounded-lg bg-[#f2f3f5]" />
              <view class="h-[24px] w-[120px] rounded-lg bg-[#f2f3f5]" />
            </div>
          </li>
          <li>
            <view class="h-[24px] w-[80px] rounded-full bg-[#f2f3f5]" />
          </li>
        </ul>

        <view class="mt-2 mb-8 h-[50px] w-full rounded-lg bg-[#f2f3f5]" />

        <view class="my-4 h-[134px] w-full rounded-lg bg-[#f2f3f5]" />
        <view class="h-[96px] w-full rounded-lg bg-[#f2f3f5]" />

        <view class="mt-4 space-y-[1px] rounded-lg">
          <view v-for="item in 5" :key="item" class="h-[50px] w-full bg-[#f2f3f5]"></view>
        </view>
      </view>
    </uni-transition>

    <uni-transition mode-class="fade" :show="!showSkeletion">
      <view>
        <view class="relative p-4">
          <view class="absolute -bottom-14 left-0 right-0 top-0 w-screen bg-blue-700">
            <image
              class="h-full w-full"
              mode="aspectFill"
              :src="getStaticResourceUrl('me/header-bgc')"
            />
          </view>

          <view class="z-1 relative my-4 mb-2">
            <view class="flex items-center">
              <view class="relative mr-4 flex-shrink-0 rounded-full">
                <image
                  v-if="!isAvatarError"
                  class="h-[50px] w-[50px] overflow-hidden rounded-full border-[1px] border-solid border-white"
                  mode="aspectFill"
                  :src="avatarIcon"
                  @error="isAvatarError = true"
                />
                <image
                  v-else
                  class="h-[50px] w-[50px] overflow-hidden rounded-full"
                  mode="aspectFill"
                  :src="getStaticResourceUrl('me/avatar-icon')"
                />
              </view>

              <view class="flex-1">
                <view class="flex flex-1 justify-between">
                  <view class="flex flex-1 items-center">
                    <view class="text-white">
                      <view>{{ userInfo?.username }}</view>
                      <view class="mt-1 text-sm">{{ account }}</view>
                    </view>
                  </view>

                  <!-- <view
                    class="flex h-6 items-center rounded-full bg-white bg-opacity-30 px-4"
                    @click="useNavigtorH5({ path: '/personalData' })"
                  >
                    <text class="text-xs leading-none text-white">编辑门店</text>
                  </view> -->
                  <view>
                    <view
                      class="rounded-full bg-white bg-opacity-30 px-4 pb-1 text-white"
                      @click="openScan"
                    >
                      <uni-icons type="scan" class="text-[20px]" color="#fff"></uni-icons>
                      <text class="ml-2 text-[14px]">扫码认证</text>
                    </view>
                  </view>
                </view>
              </view>
            </view>
          </view>

          <view
            class="z-1 relative flex w-full items-center justify-start rounded-xl bg-white bg-opacity-10 p-2 text-left"
          >
            <view class="shrink-0 rounded-full bg-white" @click="popupRef.open()">
              <view class="p-2 text-xs">
                <text class="h-full text-theme-blue">
                  {{ positionName }}
                </text>
                <uni-icons type="forward" size="12" color="#007aff"></uni-icons>
              </view>
            </view>
            <view class="ml-2 flex-1 break-all text-xs text-white">{{ shopName }}</view>
          </view>
        </view>
        <view class="z-1 relative m-4 rounded-lg bg-white shadow">
          <ExchangeSignCard />
        </view>

        <view class="m-4 rounded-lg bg-white p-4 shadow">
          <view class="grid grid-cols-3 gap-4">
            <view v-for="item in menuList[0]" :key="item.id">
              <view
                class="flex h-full flex-col justify-center text-center"
                @click="useNavigtorH5(item)"
              >
                <image
                  class="mb-2 h-10 w-full"
                  mode="aspectFit"
                  :src="getStaticResourceUrl(`me/${item.iconName}`)"
                />
                <text class="text-xs text-gray-600">{{ item.text }}</text>
              </view>
            </view>
          </view>
          <!-- <uni-grid :column="3" :show-border="false">
            <uni-grid-item v-for="item in menuList[0]" :key="item.id"> </uni-grid-item>
          </uni-grid> -->
        </view>
        <view class="z-1 relative m-4 overflow-hidden rounded-lg bg-white shadow">
          <uni-list>
            <uni-list-item
              v-for="item in menuList[1]"
              :key="item.id"
              :title="item.text"
              :right-text="item.id === 7 ? `版本号：${version}` : ''"
              show-arrow
              clickable
              :thumb="getStaticResourceUrl(`me/${item.iconName}`)"
              @click="useNavigtorH5(item)"
            />
          </uni-list>
        </view>
        <view class="m-4 px-4">
          <button
            class="rounded-full !bg-text-primary !text-white"
            :class="{ '!opacity-70 ': loading }"
            :loading="loading"
            :disabled="loading"
            @click="onLogout"
          >
            退出账号
          </button>
        </view>
        <view class="h-4"></view>
        <view class="my-4 text-center text-xs text-gray-400">v{{ appVerson }}</view>
        <view class="h-4"></view>
      </view>
    </uni-transition>

    <uni-popup ref="popupRef" type="bottom" background-color="#fff" :safe-area="false">
      <uni-section title="职位切换">
        <template #right>
          <uni-icons type="clear" size="30" @click="popupRef.close()"></uni-icons>
        </template>
      </uni-section>
      <view class="bg-page-gray">
        <scroll-view :scroll-y="true" style="max-height: 80vh">
          <view
            v-for="shopItem in roleList"
            :key="shopItem.shopId"
            class="m-2 rounded bg-white p-4 shadow"
          >
            <view class="mb-4">
              <view class="mb-2 break-all text-sm">
                <text>经销商：</text>
                <text>{{ shopItem.dealerName }}</text>
              </view>
              <view v-if="shopItem.orgType !== 'Dealer'" class="break-all text-xs text-[#999]">
                <text>门店：</text>
                <text>{{ shopItem.shopName }}</text>
              </view>
            </view>
            <view class="flex flex-wrap">
              <view v-for="(option, i) in shopItem.positionList" :key="i" class="mb-2 mr-4">
                <m-button
                  :disabled="!option.enable"
                  :type="role === option.positionId ? `primary` : 'default'"
                  size="small"
                  @click="onPositionChange(shopItem, option)"
                >
                  <text>{{ option.positionName }}</text>
                  <text v-if="!option.enable">~失效</text>
                </m-button>
              </view>
            </view>
          </view>
        </scroll-view>
      </view>
    </uni-popup>
  </view>
</template>
