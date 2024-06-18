import { showModal } from './common'
import { logger } from './logger'

// 如果error是对象，递归查找带msg字母的key值
const findMsg = (obj: any): string => {
  if (Array.isArray(obj)) {
    return ''
  }
  if (typeof obj === 'object') {
    for (const key in obj) {
      if (key.toLowerCase().includes('msg')) {
        return obj[key]
      }
      if (typeof obj[key] !== 'object') {
        continue
      }
      const msg = findMsg(obj[key])
      if (msg) {
        return msg
      }
    }
  } else if (['string', 'number'].includes(typeof obj)) {
    return `${obj}` as string
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

interface IRequest extends UniApp.RequestSuccessCallbackResult {
  data?: UniApp.RequestSuccessCallbackResult['data'] | undefined
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
      response: UniApp.RequestSuccessCallbackResult,
      request: {
        requestOptions: UniNamespace.RequestOptions
        customOptions: CustomOptions
      },
    ) => Promise<IRequest>
  }

  constructor() {
    this.baseURL = ''
    this.loadingTaskQueueCount = 0

    this.interceptors = {
      request: undefined,
      response: undefined,
    }
  }

  setConfig(config: { baseURL: string }) {
    this.baseURL = config.baseURL ?? this.baseURL
  }

  interceptorsRequest(callback: () => Promise<any>) {
    this.interceptors.request = callback
  }

  interceptorsResponse(callback: () => Promise<any>) {
    this.interceptors.response = callback
  }

  toggleLoading(
    {
      isShowNavbarLoading,
      isShowLoading,
    }: {
      isShowNavbarLoading: boolean
      isShowLoading: boolean
    },
    flag = true,
  ) {
    if (flag) {
      if (isShowNavbarLoading && this.loadingTaskQueueCount === 0) {
        uni.showNavigationBarLoading()
      }
      if (isShowLoading && this.loadingTaskQueueCount === 0) {
        uni.showLoading({ mask: true })
      }
      if (isShowNavbarLoading || isShowLoading) {
        this.loadingTaskQueueCount += 1
      }
    } else {
      if (isShowNavbarLoading || isShowLoading) {
        // this.loadingTaskQueueCount -= 1
        this.loadingTaskQueueCount = 0
      }
      // 导航加载只有在所有请求都完成后才会关闭
      if (this.loadingTaskQueueCount < 1) {
        uni.hideNavigationBarLoading()
      }
      // 遮罩在第一个请求完成后关闭
      uni.hideLoading()
    }
  }

  /**
   * 针对小程序请求的二次封装，不包含业务代码
   * @param {Object} requestOptions 参考uni.request的参数
   * @param {Object} customOptions 自定义参数
   * @param {Boolean} customOptions.baseURL 接口的基础路径
   * @param {Boolean} customOptions.isShowNavbarLoading 是否显示顶部loading
   * @param {Boolean} customOptions.isShowLoading 是否显示loading
   * @param {Boolean} customOptions.isShowError 是否显示错误信息
   * @param {Boolean} customOptions.isShowSuccess 是否显示成功信息
   * */
  async request(requestOptions: UniNamespace.RequestOptions, customOptions: CustomOptions) {
    const { baseURL: _baseURL, interceptors } = this
    const { url: _url, ...other } = requestOptions
    const {
      baseURL,
      isShowNavbarLoading = true,
      isShowLoading = true,
      isShowError = true,
      isShowSuccess = false,
    } = customOptions

    let url = _url
    if (!/^http/.test(_url)) {
      url = `${baseURL || _baseURL}${url}`
    }
    let requestParams: UniNamespace.RequestOptions = {
      url,
      ...other,
    }
    this.toggleLoading({ isShowNavbarLoading, isShowLoading }, true)
    try {
      if (interceptors && interceptors.request) {
        requestParams = await interceptors.request(requestParams, customOptions)
      }

      let response = await uni.request(requestParams)
      if (interceptors && interceptors.response) {
        response = (await interceptors.response(response as any, {
          requestOptions,
          customOptions,
        })) as any
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
        if (msg.includes('request:fail')) {
          msg = '网络请求失败，请检查网络连接'
        }
        showModal(msg)
      }
      logger.error('请求失败', { requestParams, response: error })
      return Promise.reject(error)
    } finally {
      this.toggleLoading({ isShowNavbarLoading, isShowLoading }, false)
    }
  }
}
