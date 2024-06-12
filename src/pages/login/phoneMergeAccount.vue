<route lang="json5" type="page">
{
  style: {
    navigationBarTitleText: '合并账号',
  },
}
</route>

<script setup>
import { onLoad } from '@dcloudio/uni-app'
import md5 from 'js-md5'
import { ref, reactive, computed } from 'vue'

import * as UserApi from '@/apis/common/user'
import { forceLogin } from '@/hooks/useLogin'
import { showModal } from '@/utils/common'
import { navigator } from '@/utils/navigator'

const active = ref(0) // 0 金蝶账号没有关联app账号 1 已经关联
const popupRef = ref(null)
const formRef = ref(null)
const state = reactive({
  staffInfo: { account: 18888888888, username: 'admin' },
  appInfo: {},
  list: [
    { text: '账号', key: 'account' },
    { text: '密码', key: 'password' },
  ],
  form: {},
})

const rules = {
  account: {
    rules: [{ required: true, errorMessage: '请填写账号' }],
  },
  password: {
    rules: [{ required: true, errorMessage: '请填写密码' }],
  },
}

onLoad((options) => {
  const info = JSON.parse(decodeURIComponent(options.info))
  state.staffInfo = { ...state.staffInfo, ...info }
})

const openForm = () => {
  popupRef.value.open()
}

const closeForm = () => {
  formRef.value.clearValidate()
  popupRef.value.close()
}

// 提交表单；获取app账号信息
const onVaildForm = async () => {
  try {
    const { account, password } = await formRef.value.validate()
    const { code, data } = await UserApi.getUserData({
      account,
      password: md5(password),
    })
    if (code !== 0) return
    state.appInfo = {
      account,
      username: data.realName,
      userId: data.id,
    }
    active.value = 1
    popupRef.value.close()
  } catch (error) {
    console.warn(error)
  }
}

// 不关联直接登录
const onCancelMerge = async () => {
  const { employeeId } = state.staffInfo
  const { code, data } = await UserApi.setEmployeeAccount({ employeeId })
  if (code !== 0) return
  await forceLogin({ userId: data.loginAccountId }, false)
  await showModal('初始密码888888')
  uni.switchTab({ url: '/pages/tabbar/workPage' })
}

// 关联账号后，登录
const onMergeInfo = async () => {
  const { employeeId } = state.staffInfo
  const { userId } = state.appInfo
  if (!userId) {
    console.warn(`error:params userId required`)
    return
  }
  const { code } = await UserApi.setEmployeeAccount({
    employeeId,
    userId,
  })
  if (code !== 0) return
  await forceLogin({ userId })
  await showModal('金蝶账号的密码与APP账号密码一致')
  uni.switchTab({ url: '/pages/tabbar/workPage' })
}

const goForget = () => {
  const { account = '' } = state.form
  navigator({ url: '/pages/login/forgetPassword?account=' + account })
}
</script>

<template>
  <view class="min-h-screen bg-gray-100 p-4">
    <view class="flex items-center justify-between rounded-md bg-white p-4 shadow">
      <view>
        <view class="mb-2">账号名称</view>
        <view class="text-sm text-gray-400">金蝶账号：{{ state.staffInfo.account }}</view>
        <view class="text-sm text-gray-400">手机号码：{{ state.staffInfo.phone }}</view>
      </view>
      <image
        class="ml-4 h-20 w-20 shrink-0"
        mode="aspectFill"
        src="https://derucci-app-obs.iderucci.com/cloud-derucci-system/20221019/R3JvdXAlMjA3NjUlMjAoMSkuMTY2NjE0MDMyMjA4Ng==.png"
      />
    </view>
    <template v-if="active == 0">
      <view class="mb-4 mt-4 flex justify-between">
        <m-button type="primary" plain @click="onCancelMerge">不用关联，直接登录</m-button>
        <m-button type="primary" @click="openForm">我要关联，APP账号数据</m-button>
      </view>
      <view class="mb-2 text-xs text-gray-500">不用关联，不需要关联APP原有数据</view>
      <view class="text-xs text-gray-500">
        我要关联，金蝶账号自动获取APP账号的原有数据，后续使用金蝶账号就能查看新旧数据
      </view>
    </template>
    <template v-else>
      <view class="my-4 flex justify-center">
        <image
          class="h-8 w-20"
          mode="aspectFit"
          src="https://derucci-app-obs.iderucci.com/cloud-derucci-system/20221019/R3JvdXAlMjA3NjYuMTY2NjE0MDk2NDQ4OQ==.png"
        />
      </view>

      <view class="flex items-center justify-between rounded-md bg-white p-4 shadow">
        <view>
          <view class="mb-2 text-lg">关联APP账号数据</view>
          <view class="mb-2">{{ state.appInfo.username }}</view>
          <view class="text-sm text-gray-400">APP账号：{{ state.appInfo.account }}</view>
          <view class="text-sm text-gray-400">
            只能关联一次账号数据，且不能取消绑定，请确认信息无误后，再做关联！
          </view>
        </view>
        <image
          class="ml-4 h-16 w-16 shrink-0"
          mode="aspectFit"
          src="https://derucci-app-obs.iderucci.com/cloud-derucci-system/20221013/dmVyLjE2NjU2NDMyODg5Mzk=.png"
        />
      </view>
      <view class="mb-4 mt-4 grid grid-cols-2 gap-x-2">
        <m-button block type="primary" plain @click="active = 0">取消</m-button>
        <m-button block type="primary" @click="onMergeInfo">信息无误，确认关联</m-button>
      </view>
    </template>

    <uni-popup ref="popupRef" background-color="#fff">
      <view class="w-80 rounded-md p-4">
        <uni-section title="账号关联验证">
          <template #right>
            <text class="text-indigo-500" @click="goForget">忘记密码</text>
          </template>
        </uni-section>
        <uni-forms ref="formRef" :border="true" :model="state.form" :rules="rules">
          <uni-forms-item v-for="(item, i) in state.list" :key="i" :name="item.key">
            <uni-easyinput
              v-model="state.form[item.key]"
              class="login-form-input"
              trim="all"
              :input-border="false"
              :type="item.key == 'password' ? 'password' : 'text'"
              :placeholder="`请输入${item.text}`"
            />
          </uni-forms-item>
        </uni-forms>
        <view class="mb-4 mt-4 grid grid-cols-2 gap-x-2">
          <m-button block round size="small" type="primary" plain @click="closeForm">取消</m-button>
          <m-button block round size="small" type="primary" :loading-click="onVaildForm">
            确定
          </m-button>
        </view>
      </view>
    </uni-popup>
  </view>
</template>

<style lang="scss" scoped></style>
