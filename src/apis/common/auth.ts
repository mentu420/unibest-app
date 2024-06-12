import { useUserStore } from '@/store/'
import { mergingStep } from '@/utils/common'
import { logout } from '@/utils/navigator'
import { http } from '@/apis/http'

interface IToken {
  token: string
  id: string
  tokenDeadline: string
  refreshToken: string
}

const { VITE_APP_CLIENT_CODE } = import.meta.env

export const getAuthHeaders = () => {
  const { system, platform, deviceType, deviceModel, deviceId } = uni.getDeviceInfo()
  const carrier_name = `${platform} ${deviceType} miniProgram`
  return {
    system_name: system, // 系统名称
    carrier_name, // 载体名称
    app_version: import.meta.env.VITE_APP_VERSION, // 版本
    equipment_name: deviceModel, // 设备名称
    equipment_code: deviceId, // 设备码
  }
}

// 获取settoken
export const fetchSettoken = mergingStep(async (data, options = {}) => {
  const { useSetToken, useGetToken } = useUserStore()
  const { id } = useGetToken()
  const result = await http(
    {
      url: '/user/accountlogin/settoken',
      method: 'POST',
      data: {
        systemCode: VITE_APP_CLIENT_CODE,
        userId: id,
        ...data,
      },
      header: {
        'content-type': 'application/x-www-form-urlencoded',
        ...getAuthHeaders(),
      },
    },
    {
      withToken: false,
      responseType: 'data',
      ...options,
    },
  )

  useSetToken(result)
  return result?.token
})

// token 刷新接口
export const refreshTokenRequest = mergingStep(async () => {
  try {
    const { useGetToken, useSetToken } = useUserStore()
    const { refreshToken } = useGetToken()
    const { data } = await http(
      {
        url: '/user/accountlogin/refreshtoken',
        method: 'POST',
        data: {
          refreshToken,
          systemCode: VITE_APP_CLIENT_CODE,
        },
        header: {
          'content-type': 'application/x-www-form-urlencoded',
        },
      },
      {
        withToken: false,
        withDefaultData: true,
      },
    )
    useSetToken(data)
    return data?.token
  } catch (error) {
    const { code = 0, msg } = error?.data || {}
    if (code === 0) return
    logout(msg || '您的登录信息已失效，请重新登录！')
  }
})

/** 微信登录获取token openid */
export const requestWechatToken = mergingStep(async (options = {}) => {
  const { useSetWechatToken, useGetWechatToken } = useUserStore()
  const token = useGetWechatToken()
  if (token) return token
  const { code, errMsg } = await uni.login()
  if (!code) {
    return Promise.reject(new Error(errMsg))
  }
  const data = await http(
    {
      url: '/user/wechatlogin/applets',
      method: 'POST',
      data: {
        code,
        systemCode: 41, // 固定参数
      },
      header: {
        'content-type': 'application/x-www-form-urlencoded',
      },
    },
    {
      withToken: false,
      withDefaultData: true,
      responseType: 'data',
      ...options,
    },
  )
  useSetWechatToken(data)
  return data
})
