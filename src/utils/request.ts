import { showModal } from './common'
import { logger } from './logger'

// Recursively find a key with 'msg' in its name within an object
const findMsg = (obj: any): string => {
  if (Array.isArray(obj)) {
    for (const item of obj) {
      const msg = findMsg(item)
      if (msg) return msg
    }
    return ''
  } else if (typeof obj === 'object' && obj !== null) {
    for (const key in obj) {
      if (key.toLowerCase().includes('msg')) {
        return obj[key]
      }
      const msg = findMsg(obj[key])
      if (msg) return msg
    }
  } else if (typeof obj === 'string' || typeof obj === 'number') {
    return obj.toString()
  }
  return ''
}

export interface CustomOptions {
  baseURL?: string
  isShowNavbarLoading?: boolean
  isShowLoading?: boolean
  isShowError?: boolean
  isShowSuccess?: boolean
}

interface IRequest extends Omit<UniApp.RequestSuccessCallbackResult, 'data'> {
  data: string | AnyObject | ArrayBuffer
}

export default class Request {
  baseURL: string
  loadingTaskQueueCount: number
  interceptors: {
    request?: (
      requestOptions: UniNamespace.RequestOptions,
      customOptions: CustomOptions,
    ) => Promise<UniNamespace.RequestOptions>
    response?: (
      response: IRequest,
      request: {
        requestOptions: UniNamespace.RequestOptions
        customOptions: CustomOptions
      },
    ) => Promise<IRequest>
  }

  constructor() {
    this.baseURL = ''
    this.loadingTaskQueueCount = 0
    this.interceptors = {}
  }

  setConfig(config: { baseURL: string }) {
    this.baseURL = config.baseURL ?? this.baseURL
  }

  interceptorsRequest(
    callback: (
      requestOptions: UniNamespace.RequestOptions,
      customOptions: CustomOptions,
    ) => Promise<UniNamespace.RequestOptions>,
  ) {
    this.interceptors.request = callback
  }

  interceptorsResponse(
    callback: (
      response: IRequest,
      request: { requestOptions: UniNamespace.RequestOptions; customOptions: CustomOptions },
    ) => Promise<IRequest>,
  ) {
    this.interceptors.response = callback
  }

  toggleLoading(
    {
      isShowNavbarLoading,
      isShowLoading,
    }: { isShowNavbarLoading: boolean; isShowLoading: boolean },
    flag: boolean,
  ) {
    if (flag) {
      if (isShowNavbarLoading && this.loadingTaskQueueCount === 0) uni.showNavigationBarLoading()
      if (isShowLoading && this.loadingTaskQueueCount === 0) uni.showLoading({ mask: true })
      this.loadingTaskQueueCount += 1
    } else {
      this.loadingTaskQueueCount = Math.max(0, this.loadingTaskQueueCount - 1)
      if (this.loadingTaskQueueCount === 0) {
        if (isShowNavbarLoading) uni.hideNavigationBarLoading()
        if (isShowLoading) uni.hideLoading()
      }
    }
  }

  async request(requestOptions: UniNamespace.RequestOptions, customOptions: CustomOptions) {
    const { interceptors } = this
    const { url: _url, ...otherOptions } = requestOptions
    const {
      baseURL,
      isShowNavbarLoading = true,
      isShowLoading = true,
      isShowError = true,
      isShowSuccess = false,
    } = customOptions

    const url = _url.startsWith('http') ? _url : `${baseURL || this.baseURL}${_url}`
    let requestParams = { url, ...otherOptions }

    this.toggleLoading({ isShowNavbarLoading, isShowLoading }, true)

    try {
      if (interceptors.request) {
        requestParams = await interceptors.request(requestParams, customOptions)
      }

      let response = await uni.request(requestParams)
      console.log('response', response)
      if (interceptors.response) {
        response = await interceptors.response(response as IRequest, {
          requestOptions: requestParams,
          customOptions,
        })
      }

      const msg = findMsg(response)
      if (isShowSuccess && msg) {
        uni.showToast({
          title: msg,
          icon: 'none',
        })
      }

      logger.debug('接口请求', { requestParams, response })
      return response
    } catch (error) {
      let msg = findMsg(error)
      if (isShowError && msg) {
        msg = msg.includes('request:fail') ? '网络请求失败，请检查网络连接' : msg
        showModal(msg)
      }
      logger.error('请求失败', { requestParams, error })
      throw error
    } finally {
      this.toggleLoading({ isShowNavbarLoading, isShowLoading }, false)
    }
  }
}
