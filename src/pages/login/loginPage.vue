<route lang="json5" type="home">
{
  style: {
    navigationStyle: 'custom',
    navigationBarTitleText: '登录',
  },
}
</route>

<script setup>
import { onShow, onLoad } from '@dcloudio/uni-app'
import { computed, reactive, ref, watch } from 'vue'

import { getSysConfigList } from '@/apis/common/system'
import { accountLogin, forceLogin } from '@/hooks/useLogin'
import { useUserStore } from '@/store/'
import { showModal } from '@/utils/common'
import { navigator } from '@/utils/navigator'
import { getStorage, setStorage, removeStorage } from '@/utils/storage'

const USER_LOGIN = 'USER_LOGIN'

const formRef = ref(null)
const remember = ref('1') // 记住密码
const loading = ref(false)
const count = ref(0)
const state = reactive({
  form: {
    account: '',
    password: '',
  },
  list: [
    { text: '账号', key: 'account', active: false },
    { text: '密码', key: 'password', active: false },
  ],
})

const isActive = computed(() => (item) => {
  return item.active || state.form[item.key] !== ''
})

const rules = computed(() => ({
  account: {
    rules: [{ required: true, errorMessage: '请填写账号' }],
    validateTrigger: 'submit',
  },
  password: {
    rules: [{ required: true, errorMessage: '请填写密码' }],
    validateTrigger: 'submit',
  },
}))

const rememberPassword = () => {
  if (remember.value) {
    setStorage(USER_LOGIN, state.form)
  } else {
    removeStorage(USER_LOGIN)
  }
}

const goHome = async () => {
  navigator({ url: '/pages/tabbar/workPage' }, 'switchTab')
}

const onSubmit = async () => {
  try {
    loading.value = true
    const { account, password } = await formRef.value.validate()
    await accountLogin({ account, password })
    setStorage('account', account)
    rememberPassword()
    goHome()
  } catch (error) {
    console.warn(error)
  } finally {
    await new Promise((resolve) => setTimeout(resolve, 1000))
    loading.value = false
  }
}

// 异步验证开发者密码
const getDevPassword = async () => {
  const { page } = await getSysConfigList({
    page: 1,
    limit: 1,
    paramKey: 'MARKETING_DEVELOPMENT_PASSWORD',
    sidx: 'paramKey',
  })
  return page?.list[0]?.paramValue
}

const openDevelopment = async () => {
  try {
    const maxCount = 10
    ++count.value
    if (maxCount - count.value <= 3 && count.value !== maxCount) {
      uni.showToast({
        title: `再点击${maxCount - count.value}下，将打开开发者模式`,
        icon: 'none',
      })
    }
    if (count.value < maxCount) return
    uni.hideToast()
    count.value = 0
    const { content } = await showModal('', {
      title: '开发者密码：',
      editable: true,
      placeholderText: '请输入开发者密码',
    })
    const devPassword = await getDevPassword()
    console.log('devPassword', devPassword)
    if (content !== devPassword) {
      showModal('开发者密码不正确')
      return
    }
    const { account } = await formRef.value.validate()
    loading.value = true
    await forceLogin({ account })
    rememberPassword()
    goHome()
  } finally {
    loading.value = false
  }
}

const goPhoneLogin = () => {
  navigator({ url: '/pages/login/phoneLogin' })
}
const goForget = () => {
  navigator({ url: '/pages/login/forgetPassword?account=' + state.form.account })
}

const init = () => {
  const { useRemoveToken } = useUserStore()
  useRemoveToken()
  const form = getStorage(USER_LOGIN)
  if (form) state.form = form
}

init()
</script>

<template>
  <view class="container">
    <view class="login-bgc">
      <image
        class="bgc-image"
        mode="widthFix"
        src="https://derucci-app-obs.iderucci.com/cloud-derucci-system/20221103/bG9naW5fYmdjLjE2Njc0MzY2MzUxMDE=.png"
      />
    </view>
    <view class="login-welcome" @click="openDevelopment">
      <image
        class="logo"
        mode="aspectFill"
        src="https://derucci-app-obs.iderucci.com/cloud-derucci-system/20221013/dmVyLjE2NjU2NDMyODg5Mzk=.png"
      />
      <view>
        <text>Hi,</text>
      </view>
      <text class="login-welcome__tips">欢迎使用营销助手</text>
    </view>
    <view class="login-form">
      <uni-forms ref="formRef" :model="state.form" :rules="rules">
        <uni-forms-item v-for="(item, i) in state.list" :key="i" :name="item.key">
          <view class="login-form__item">
            <text class="form-label" :class="{ active: isActive(item) }">
              {{ item.text }}
            </text>
            <uni-easyinput
              v-model="state.form[item.key]"
              class="login-form-input"
              trim="all"
              :input-border="false"
              :type="item.key == 'password' ? 'password' : 'text'"
              @focus="item.active = true"
              @blur="item.active = false"
            />
            <view class="form-item__line" :class="{ active: item.active }"></view>
          </view>
        </uni-forms-item>
        <view class="form-footer">
          <label
            @click="
              () => {
                if (remember === '1') return (remember = '0')
                remember = '1'
              }
            "
          >
            <radio class="scale-80" color="#007aff" value="1" :checked="remember === '1'" />
            记住密码
          </label>
          <view>
            <text class="forget" @click="goForget">忘记密码？</text>
          </view>
        </view>
      </uni-forms>
      <button class="btn-primary" :loading="loading" :disabled="loading" @click="onSubmit">
        登录
      </button>
      <view class="phone-login">
        <text @click="goPhoneLogin">手机号登录</text>
      </view>
      <view class="p-4 text-center text-xs text-gray-400">
        注：金蝶账号，首次登录，请使用手机号登录
      </view>
    </view>
  </view>
</template>

<style lang="scss" scoped>
.container {
  flex: 1;
}
.login-welcome {
  margin-top: 120rpx;
  text-align: center;
}
.logo {
  width: 120rpx;
  height: 120rpx;
}
.login-bgc {
  position: fixed;
  top: 0;
  left: 0;
  z-index: -1;
  width: 100vw;
}
.bgc-image {
  width: 100vw;
}
.login-welcome__tips {
  font-size: 12px;
  color: #666;
}
.login-form {
  padding: 80rpx;
  &:deep(.is-required) {
    display: none;
  }
}
.login-form__item {
  position: relative;
  padding-top: 40rpx;
}
.form-item__line {
  height: 1rpx;
  background-color: #e5e5e5;
  transition-duration: 0.3s;
  transition-property: background-color;
}

.form-label {
  position: absolute;
  top: 40rpx;
  z-index: 99;
  padding-left: 20rpx;
  line-height: 2;
  transition-timing-function: ease-out;
  transition-duration: 0.3s;
  transition-property: top;
}
.form-label.active {
  top: 5rpx;
  font-size: 10px;
  color: #999;
}
.form-item__line.active {
  background-color: $uni-color-primary;
}
.form-footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 40rpx 0;
}
.forget {
  color: $uni-color-primary;
}

.login-btn {
  background-color: $uni-color-primary;
  border-radius: 80rpx;
}
.phone-login {
  margin: 40rpx;
  font-size: 28rpx;
  color: $uni-color-primary;
  text-align: center;
}
</style>
