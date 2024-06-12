import { useUserStore } from '@/store/'
import { mergingStep } from '@/utils/common'
import Request, { type CustomOptions } from '@/utils/request'
import { getStorage, removeStorage } from '@/utils/storage'
import md5 from 'blueimp-md5'
import dayjs from 'dayjs'
import { stringify } from 'qs'
import isBetween from 'dayjs/plugin/isBetween'

import { logoutDebounce } from '@/utils/navigator'
import { fetchSettoken, refreshTokenRequest } from './common/auth'
import { StorageEnum } from '@/enums/storage'

dayjs.extend(isBetween)

// 慕思通用请求实例
const commonRequest = new Request()

commonRequest.setConfig({
  baseURL: import.meta.env.VITE_APP_CLOUD_BASE_URL,
})

// 加工请求头，签名等，将第一个参数返回则请求继续，抛出异常或者返回Promise.reject则请求中断
commonRequest.interceptors.request = async (requestParams, customOptions: HttpCustomOptions) => {
  const {
    withPhone = true,
    withDefaultData = false,
    withUserId = false,
    withUserInfoFn = null,
  } = customOptions
  if (withDefaultData) {
    // 添加默认参数
    requestParams.data = {
      appId: import.meta.env.VITE_APP_APP_ID,
      appType: 'WECHAT_MINI_PROGRAM',
      ...(requestParams.data as AnyObject),
    }
  }
  requestParams.header = {
    ...requestParams.header,
    // 接口签名
    ...(await getSign(withPhone)),
  }
  const { useUserInfoSync } = useUserStore()
  if (withUserId) {
    const { useUserInfoSync } = useUserStore()
    requestParams.data = {
      userId: (await useUserInfoSync()).userId,
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

// 处理返回体的业务代码，返回Promise.reject或者抛出异常，会被统一处理
commonRequest.interceptors.response = async (response, { customOptions, requestOptions }) => {
  const {
    responseType = 'body',
    isCheckError = true,
    customResponse = null,
  } = customOptions as HttpCustomOptions
  if (!isCheckError) {
    return response
  }
  // 请求成功
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
      if ([101, 105].includes(response?.data?.code)) {
        // token失效、登录过期
        removeStorage(StorageEnum.TOKEN)
        return http(requestOptions as any, customOptions)
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

  // 服务错误
  let msg = ''
  switch (response.statusCode) {
    case 404:
      msg = '资源不存在'
      break
    case 500:
      msg = '服务器错误'
      break
    default:
      msg = '未知错误'
  }
  return Promise.reject(new Error(`${msg}，请联系管理员`))
}

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
    api_client_code: import.meta.env.VITE_APP_CLIENT_CODE,
    api_version: import.meta.env.VITE_APP_API_VERSION,
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
}

export type ResponseData = string | AnyObject | ArrayBuffer
export type RequestData = string | AnyObject | ArrayBuffer

export interface HttpRequestOptions<T extends RequestData = any>
  extends UniNamespace.RequestOptions {
  data?: T
}
export interface HttpResponse<T extends ResponseData> extends UniApp.RequestSuccessCallbackResult {
  data: T
}

// export async function http<T extends ResponseData = any, P extends RequestData = any>(
//   requestOptions: HttpRequestOptions<P>,
//   customOptions?: HttpCustomOptions & { responseType: 'original' },
// ): Promise<HttpResponse<T>>

// export async function http<T extends ResponseData = any, P extends RequestData = any>(
//   requestOptions: HttpRequestOptions<P>,
//   customOptions?: HttpCustomOptions & { responseType: 'data' },
// ): Promise<T>

// export async function http<T extends ResponseData = any, P extends RequestData = any>(
//   requestOptions: HttpRequestOptions<P>,
//   customOptions?: HttpCustomOptions & { responseType?: 'body' },
// ): Promise<HttpResponse<T>['data']>

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export async function http<_T extends ResponseData = any, P extends RequestData = any>(
  requestOptions: HttpRequestOptions<P>,
  customOptions?: HttpCustomOptions,
) {
  return commonRequest.request(requestOptions, customOptions || {})
}
