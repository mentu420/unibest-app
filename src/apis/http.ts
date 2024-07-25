import { useUserStore } from '@/store/'
import { mergingStep } from '@/utils/common'
import Request, { type CustomOptions } from '@/utils/request'
import { getStorage, removeStorage } from '@/utils/storage'
import md5 from 'blueimp-md5'
import dayjs from 'dayjs'
import { stringify } from 'qs'
import isBetween from 'dayjs/plugin/isBetween'

import { logoutDebounce } from '@/utils/navigator'
import { fetchSettoken, refreshTokenRequest, getSystemCode } from './common/auth'
import { StorageEnum } from '@/enums/storage'
import { API_VERSION } from '@/enums/system'

dayjs.extend(isBetween)

// 慕思通用请求实例
const commonRequest = new Request()
commonRequest.setConfig({
  baseURL: import.meta.env.VITE_SERVER_BASEURL,
})

// 请求拦截器
async function requestInterceptor(
  requestParams: UniNamespace.RequestOptions,
  customOptions: HttpCustomOptions,
) {
  const { withToken = true, withUserId = false, withUserInfoFn = null } = customOptions
  requestParams.header = {
    ...requestParams.header,
    ...(await getSign(withToken)),
  }

  const { useGetToken, useUserInfoSync } = useUserStore()
  if (withUserId) {
    requestParams.data = {
      userId: useGetToken().id,
      ...(requestParams.data as AnyObject),
    }
  }
  if (withUserInfoFn) {
    requestParams.data = {
      ...withUserInfoFn(await useUserInfoSync()),
      ...(requestParams.data as AnyObject),
    }
  }
  return requestParams
}

function handleErrorResponse(response: UniApp.RequestSuccessCallbackResult) {
  const messages: { [key: number]: string } = {
    404: '资源不存在',
    500: '服务器错误',
  }
  const error = new Error(messages[response.statusCode] || '未知错误，请联系管理员')
  return Promise.reject(error)
}

// 响应拦截器
async function responseInterceptor(
  response: UniApp.RequestSuccessCallbackResult,
  {
    customOptions,
    requestOptions,
  }: { customOptions: HttpCustomOptions; requestOptions: UniNamespace.RequestOptions },
) {
  let {
    responseType = 'body',
    isCheckError = true,
    customResponse = null,
    withRetryCount = 2,
  } = customOptions

  if (!isCheckError) return response
  if (response.statusCode === 200) {
    if (Object.prototype.toString.call(response?.data) === '[object Object]') {
      response.data = response?.data as AnyObject
      if (response?.data?.code === 0 || response?.data?.status === 0) {
        // 状态码为0，请求成功
        switch (responseType) {
          case 'body':
            return response?.data
          case 'data':
            return response?.data?.data
          case 'original':
          default:
            return response
        }
      }
      if ([101, 102, 105].includes(response?.data?.code) && withRetryCount > 0) {
        if (response?.data?.code === 105 && import.meta.env.VITE_APP_AUTH_SS0 === '1') {
          logoutDebounce(response?.data?.msg || '您的账号已在别处登录，您已被迫下线！')
          return Promise.reject(response)
        }
        --withRetryCount
        // token失效、登录过期 刷新token
        const token = await refreshTokenInterceptor(false)
        if (!token) return Promise.reject(response)
        return http(requestOptions, { ...customOptions, withRetryCount })
      }
    } else {
      // 返回的值不为对象/json
      if (customResponse) {
        return customResponse(response)
      } else {
        return customResponse
      }
    }
    // 状态码不为0，请求失败
    return Promise.reject(response)
  }
  return handleErrorResponse(response)
}

// 设置拦截器
commonRequest.interceptors.request = requestInterceptor
commonRequest.interceptors.response = responseInterceptor

// 获取token/如果过期返回一个promise
export const refreshTokenInterceptor = mergingStep(async (auth = true) => {
  if (auth) {
    const { useGetToken } = useUserStore()
    const { tokenDeadline, token } = useGetToken()
    const lastTime = dayjs(tokenDeadline).add(7, 'day').format('YYYY-MM-DD HH:mm:ss')
    const nowTime = dayjs().format('YYYY-MM-DD HH:mm:ss')
    if (dayjs(tokenDeadline).isBetween(nowTime, lastTime, undefined, '[]')) return token
  }
  return import.meta.env.VITE_APP_AUTH_SS0 === '1'
    ? await refreshTokenRequest()
    : await fetchSettoken()
})

interface Isign {
  api_client_code: string
  api_version: string
  api_timestamp: string
  api_sign?: string
}

export const getSign = async (withToken = true) => {
  let api_token = ''
  if (withToken) {
    api_token = await refreshTokenInterceptor()
    if (!api_token) {
      logoutDebounce()
      throw new Error('未授权用户')
    }
  }
  const sign: Isign = {
    ...(api_token ? { api_token } : {}),
    api_client_code: getSystemCode(),
    api_version: API_VERSION,
    api_timestamp: `${Date.now()}`,
  }
  const str = stringify(sign)
  sign.api_sign = md5(str).toUpperCase()
  return sign
}

type ResponseType = 'body' | 'data' | 'original'

export interface HttpCustomOptions extends CustomOptions {
  withToken?: boolean
  withPhone?: boolean
  withDefaultData?: boolean
  withUserId?: boolean
  withUserInfoFn?: (userInfo: IUserInfo) => AnyObject
  responseType?: ResponseType
  isCheckError?: boolean
  customResponse?: (data: UniApp.RequestSuccessCallbackResult) => any
  withRetryCount?: number
}

export type ResponseData = string | AnyObject | ArrayBuffer
export type RequestData = string | AnyObject | ArrayBuffer

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export async function http(
  requestOptions: UniApp.RequestOptions,
  customOptions?: HttpCustomOptions,
): Promise<HttpResponse> {
  return commonRequest.request(requestOptions, customOptions || {})
}
