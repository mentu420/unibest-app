<route lang="json5" type="page">
{
  style: {
    navigationBarTitleText: '忘记密码',
  },
}
</route>

<script setup>
import { onLoad } from '@dcloudio/uni-app'
import { reactive, ref } from 'vue'

import * as UserApi from '@/apis/common/user'
import CountDown from '@/components/common/CountDown.vue'
import { validPassword } from '@/hooks/useFormVaildate'
import { accountLogin } from '@/hooks/useLogin'
import { showModal } from '@/utils/common'
import { useSMS } from '@/hooks/useSMS'

const { graphicImage, getGraphicImage, onSendSMS } = useSMS()

const passwordTips = '密码必须为6-18位字母和数字组合，英文区分大小写'
const account = ref('') // 账号
const setp = ref(0) // 0： 填写账号 1：接受验证码并设置新密码
const accountFormRef = ref(null) // 账号表单ref
const ruleFormRef = ref(null) // 短信、密码表单ref
const passwordForm = ref({}) // 短信、密码表单

const passwordRules = {
  sms: {
    rules: [{ required: true, errorMessage: '请填写验证码' }],
  },
  password: {
    rules: [
      { required: true, errorMessage: '请填写密码' },
      {
        errorMessage: passwordTips,
        validateFunction: (rule, value, data, callback) => {
          return validPassword(value)
        },
      },
    ],
  },
  repeatPassword: {
    rules: [
      {
        required: true,
        errorMessage: '请填写确认密码',
      },
      {
        errorMessage: '确认密码与新密码不一致',
        validateFunction: (rule, value, data, callback) => {
          return data.password === data.repeatPassword
        },
      },
    ],
  },
  graphicCode: {
    rules: [{ required: true, errorMessage: '图形验证码不能为空' }],
  },
}

onLoad((options) => {
  account.value = options?.account
})

const onAccountConfirm = async () => {
  const { account } = await accountFormRef.value.validate()
  const { code, data } = await UserApi.getUserPhone({ account })
  if (code !== 0) return
  passwordForm.value = { ...passwordForm.value, phone: data.phone }
  if (passwordForm.value.phone === '') {
    await showModal('该账号未绑定手机号码，请联系管理员维护账号后修改密码！')
    return
  }
  getGraphicImage(passwordForm.value.phone)
  setp.value = 1
}

const fetchPhoneCode = async () => {
  try {
    await ruleFormRef.value?.validateField(['graphicCode'])
    return onSendSMS({
      phone: passwordForm.value.phone,
      identify: passwordForm.value.graphicCode,
    })
  } catch (error) {
    return { code: 5000 }
  }
}

const onSubmit = async () => {
  try {
    await ruleFormRef.value.validate()
    const { password = '', sms = '', phone } = passwordForm.value

    const { code } = await UserApi.editUserPassword({
      account: account.value,
      newPassword: password,
      code: sms,
    })
    if (code !== 0) return
    await showModal('密码修改成功；请记住密码！')
    await accountLogin({ account: account.value, password })
    uni.switchTab({ url: '/pages/tabbar/workPage' })
  } catch (error) {
    console.warn(error)
  }
}
</script>

<template>
  <view class="m-4">
    <template v-if="setp == 0">
      <uni-forms
        ref="accountFormRef"
        :model="{ account }"
        :border="true"
        :rules="{
          account: {
            rules: [{ required: true, errorMessage: '账号不能为空' }],
          },
        }"
      >
        <uni-forms-item name="account" label="账号">
          <uni-easyinput
            v-model="account"
            class="login-form-input"
            trim="all"
            :input-border="false"
            :placeholder="`请输入账号`"
            :focus="true"
          />
        </uni-forms-item>
      </uni-forms>
      <button class="btn-primary mt-4" :disabled="account == ''" @click="onAccountConfirm">
        下一步
      </button>
    </template>
    <template v-else>
      <view class="mb-2 flex flex-col items-center">
        <image
          class="my-4 h-20 w-20"
          mode="aspectFit"
          src="https://derucci-app-obs.iderucci.com/cloud-derucci-system/20221013/dmVyLjE2NjU2NDMyODg5Mzk=.png"
        />
        <text class="m-2 text-gray-500">
          {{ account }}
        </text>
      </view>
      <uni-forms
        ref="ruleFormRef"
        label-width="100"
        :border="true"
        :model="passwordForm"
        :rules="passwordRules"
      >
        <uni-forms-item label="手机号" name="phone">
          <view class="flex h-full items-center">
            <text v-if="passwordForm.phone && passwordForm.phone != ''">
              {{ passwordForm.phone }}
            </text>
            <text v-else class="flex h-full items-center text-xs text-gray-400">
              账号未绑定手机号
            </text>
          </view>
        </uni-forms-item>
        <view
          v-if="passwordForm.phone && passwordForm.phone != ''"
          class="-mt-4 mb-2 text-xs text-gray-400"
        >
          验证码将发送到绑定手机号
        </view>
        <view v-else class="-mt-4 mb-2 text-xs text-gray-400">
          <text>账号未绑定手机号，无法进行验证。请联系</text>
          <text class="text-red-500">总部CRM专员</text>
          绑定手机号
        </view>
        <uni-forms-item name="graphicCode" label="图形验证码">
          <view class="flex justify-between">
            <uni-easyinput
              v-model="passwordForm.graphicCode"
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
                @click="getGraphicImage(passwordForm.phone)"
              ></uni-icons>
            </view>
          </view>
        </uni-forms-item>
        <uni-forms-item name="sms" label="验证码">
          <view class="flex justify-between">
            <uni-easyinput
              v-model="passwordForm.sms"
              class="login-form-input"
              trim="all"
              :input-border="false"
              placeholder="请输入验证码"
              :maxlength="6"
            />
            <CountDown
              :disabled="!passwordForm.phone || passwordForm.phone == ''"
              :request="fetchPhoneCode"
            />
          </view>
        </uni-forms-item>
        <uni-forms-item name="password" label="新密码">
          <uni-easyinput
            v-model="passwordForm.password"
            class="login-form-input"
            trim="all"
            type="password"
            placeholder="输入新密码"
            :input-border="false"
            :maxlength="18"
          />
        </uni-forms-item>
        <uni-forms-item name="repeatPassword" label="确认密码">
          <uni-easyinput
            v-model="passwordForm.repeatPassword"
            class="login-form-input"
            trim="all"
            type="password"
            placeholder="输入确认密码"
            :input-border="false"
            :maxlength="18"
          />
        </uni-forms-item>
      </uni-forms>
      <view class="mb-4 text-xs text-gray-300">
        {{ passwordTips }}
      </view>
      <view class="grid grid-cols-2 gap-x-2">
        <button class="btn-base" @click="setp = 0">取消</button>
        <button
          :disabled="!passwordForm.phone || passwordForm.phone == ''"
          class="btn-primary"
          @click="onSubmit"
        >
          确定
        </button>
      </view>
    </template>
  </view>
</template>
