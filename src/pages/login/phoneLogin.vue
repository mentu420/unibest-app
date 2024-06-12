<route lang="json5" type="page">
{
  style: {
    navigationBarTitleText: '金蝶登录',
  },
}
</route>

<script setup>
import { ref, computed } from 'vue'

import * as CommonApi from '@/apis/common/system'
import * as UserApi from '@/apis/common/user'
import CountDown from '@/components/common/CountDown.vue'
import { vaildPhone } from '@/hooks/useFormVaildate'
import { forceLogin } from '@/hooks/useLogin'
import { navigator } from '@/utils/navigator'
import { useSMS } from '@/hooks/useSMS'

const { graphicImage, getGraphicImage, onSendSMS } = useSMS()
const formRef = ref(null)
const form = ref({ phone: '', verifyCode: '', graphicCode: '' })
const loading = ref(false)
const rules = computed(() => ({
  phone: {
    rules: [
      { required: true, errorMessage: '手机号不能为空' },
      {
        validateFunction: () => vaildPhone(form.value.phone),
        errorMessage: '手机号格式有误',
      },
    ],
  },
  verifyCode: {
    rules: [{ required: true, errorMessage: '验证码不能为空' }],
  },
  graphicCode: {
    rules: [{ required: true, errorMessage: '图形验证码不能为空' }],
  },
}))

const checkUserInfo = async () => {
  const { code, data } = await UserApi.getEmployeeInfo({
    loginAccount: form.value.phone,
  })
  if (code !== 0) return
  const { loginAccountId = '0', loginAccount, name, id } = data
  if (loginAccountId !== '0') {
    await forceLogin({ userId: loginAccountId }, false)
    uni.switchTab({ url: '/pages/tabbar/workPage' })
    return
  }
  const info = encodeURIComponent(
    JSON.stringify({
      phone: form.value.phone,
      account: loginAccount,
      username: name,
      loginAccountId,
      employeeId: id,
    }),
  )
  navigator({ url: `/pages/login/phoneMergeAccount?info=${info}` })
}

const onSubmit = async () => {
  try {
    loading.value = true
    const formResult = await formRef.value.validate()
    if (import.meta.env.MODE === 'development' && formResult.verifyCode === '987654') {
      await checkUserInfo()
      return
    }
    const { code } = await CommonApi.validatorSmsCode({
      verifyCode: form.value.verifyCode,
      phone: form.value.phone,
    })
    if (code !== 0) return
    await checkUserInfo()
  } finally {
    await new Promise((resolve) => setTimeout(resolve, 1000))
    loading.value = false
  }
}

// 先验证账号有效性，再发验证码
const onCountDownStart = async () => {
  try {
    await formRef.value?.validateField(['phone'])
    const { code } = await UserApi.getEmployeeInfo({
      loginAccount: form.value.phone,
    })
    if (code !== 0) return { code }
    await formRef.value?.validateField(['graphicCode'])
    console.log(form.value)
    return onSendSMS({
      phone: form.value.phone,
      identify: form.value.graphicCode,
    })
  } catch (error) {
    return { code: 5000 }
  }
}
</script>

<template>
  <view class="view">
    <uni-forms ref="formRef" class="box" :border="true" :model="form" :rules="rules">
      <uni-forms-item name="phone">
        <uni-easyinput
          v-model="form.phone"
          trim="all"
          :input-border="false"
          placeholder="请输入手机号码"
          @change="getGraphicImage"
        />
      </uni-forms-item>
      <uni-forms-item name="graphicCode">
        <view class="flex justify-between">
          <uni-easyinput
            v-model="form.graphicCode"
            trim="all"
            :input-border="false"
            placeholder="请输入图形验证码"
          />
          <view class="flex items-center">
            <image class="h-[25px] w-[95px]" mode="aspectFill" :src="graphicImage" />
            <uni-icons
              class="ml-2"
              type="refreshempty"
              size="20"
              @click="getGraphicImage(form.phone)"
            ></uni-icons>
          </view>
        </view>
      </uni-forms-item>
      <uni-forms-item name="verifyCode">
        <view class="flex justify-between">
          <uni-easyinput
            v-model="form.verifyCode"
            trim="all"
            :input-border="false"
            placeholder="请输入验证码"
          />
          <CountDown
            :disabled="form.phone == '' || form.graphicCode == ''"
            :request="onCountDownStart"
          />
        </view>
      </uni-forms-item>
    </uni-forms>
    <view class="mt-8 px-4">
      <button class="btn-primary" :loading="loading" :disabled="loading" @click="onSubmit">
        登录
      </button>
    </view>
  </view>
</template>

<style lang="scss" scoped>
.view {
  margin: 20rpx;
}
</style>
