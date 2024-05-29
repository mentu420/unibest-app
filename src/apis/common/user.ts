import { useUserStore } from '@/store'
import { mergingStep } from '@/utils/common'
import { http } from '@/apis/http'
import { setStorage } from '@/utils/storage'
import { StorageEnum } from '@/enums/storage'
import md5 from 'blueimp-md5'
import { stringify } from 'qs'

/** 获取 token */
export const requestToken = mergingStep(async () => {
  const { code, errMsg } = await uni.login()
  if (!code) {
    return Promise.reject(new Error(errMsg))
  }
  const sign: {
    api_token?: string
    api_client_code: string
    api_version: string
    api_timestamp: string
    api_sign?: string
  } = {
    api_client_code: import.meta.env.VITE_APP_CLIENT_CODE,
    api_version: import.meta.env.VITE_APP_API_VERSION,
    api_timestamp: `${Date.now()}`,
  }
  const str = stringify(sign)
  sign.api_sign = md5(str).toUpperCase()
  const data = await uni.request({
    url: import.meta.env.VITE_APP_CLOUD_BASE_URL + '/user/wechatlogin/applets',
    method: 'POST',
    data: {
      code,
      systemCode: import.meta.env.VITE_APP_CLIENT_CODE,
      appId: import.meta.env.VITE_APP_APP_ID,
      appType: 'WECHAT_MINI_PROGRAM',
    },
    header: {
      'content-type': 'application/x-www-form-urlencoded',
      ...sign,
    },
  })
  const token: IUserToken = (data.data as any).data
  setStorage(StorageEnum.TOKEN, token)
  return token
})

// 获取短信验证码 金蝶登录
export const sendSms = (data) =>
  http({ url: '/commonservice/sms/identifysend', data, method: 'POST' })
