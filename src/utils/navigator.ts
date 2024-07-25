import qs from 'qs'
import { showModal, debounce } from './common'
import { useUserStore } from '@/store/'
import { removeStorage } from './storage'
import { StorageEnum } from '@/enums/storage'
import { currRoute } from './'
import { tabbarPath, commonPath } from '@/enums/navigator'

// 无需鉴权页面，直接跳转
export const authWhitePages = ['^/pages/common/.*', '^/pages/login/.*']

export const switchPages = Object.values(tabbarPath)

// 检查url
export const urlCheck = (urlList: string[], url: string) => {
  url = url.split('?')[0]
  return urlList.some((_url) => {
    return _url.includes(url)
  })
}
// 是否白名单url
export const isWhiteUrl = (url: string = '') => {
  return urlCheck(authWhitePages, url)
}
// 回到首页
export const toAuth = () => {
  navigator({
    url: tabbarPath.WORK_PATH,
  })
}
// 是否tab页面
export const isTabbarUrl = (url: string = '') => {
  return urlCheck(switchPages, url)
}
// 是否web url
export const checkIsWebURL = (url: string) => url.indexOf('http') === 0

interface NavigatorOptions extends UniApp.NavigateToOptions {
  query?: Record<string, any>
}
export const navigator = async (
  options: NavigatorOptions = {
    url: '',
  },
  type = 'navigateTo',
  withAuth = true,
) => {
  const toUrl = options.url as string

  const isWebUrl = checkIsWebURL(toUrl)
  if (isWebUrl) {
    location.href = toUrl as string
    return
  }

  const isWhite = isWhiteUrl(toUrl)
  withAuth = withAuth && !isWhite
  // 授权检测，不通过跳转授权页
  // if (withAuth) {
  //   try {
  //     await showModal('To enter this page, you need to connect a wallet.', {
  //       showCancel: true,
  //       confirmText: 'Connect',
  //     })
  //     // 去登录

  //   } catch {
  //     return
  //   }
  // }
  if (isTabbarUrl(toUrl)) {
    return uni.switchTab(options)
  }

  if (options.query) {
    const [pathUrl, searchStr] = toUrl.split('?')
    try {
      const query = Object.assign({}, qs.parse(searchStr), options.query || {})
      for (const key in query) {
        if (typeof query[key] === 'object') {
          query[key] = JSON.stringify(query[key])
        }
      }
      options.url = `${pathUrl}?${qs.stringify(query)}`
    } catch (e) {
      console.error('navigator', e)
      options.url = `${pathUrl}`
    }
  }
  if (!options.fail) {
    options.fail = async (e) => {
      await showModal(`Page does not exist`, {
        showCancel: true,
        confirmText: 'Home',
      })
      navigator({
        url: switchPages[0],
      })
    }
  }
  try {
    uni[type](options)
  } catch (error) {
    showModal('Jump failed, please try again later')
  }
}

/**
 * 导航至登录页，带上回调
 * @param {string} [url] 回调地址
 */
export const toLoginWithRedirect = (url?: string) => {
  const { path, query } = currRoute()
  if (path === commonPath.LOGIN_PAGE) return
  const redirectUrl = url || `${path}?${qs.stringify(query)}`
  uni.reLaunch({
    url: `${commonPath.LOGIN_PAGE}?redirect=${encodeURIComponent(redirectUrl)}`,
  })
}

export const redirectLoginDebounced = debounce(toLoginWithRedirect, 1250)

/**
 * 登出
 * @params message 信息提示
 * @params redirect 是否跳转到登录页面
 * **/
export const logout = async (message?: string, redirect: boolean = true) => {
  const { useClearUserStore } = useUserStore()
  useClearUserStore()
  removeStorage(StorageEnum.CLOST_EXCHANGE_SIGN)
  removeStorage(StorageEnum.STUDY_NOTICE_CLOSE)
  removeStorage(StorageEnum.ACCOUNT)
  if (message) await showModal(message)
  if (!redirect) return
  toLoginWithRedirect()
}

// 登出防抖
export const logoutDebounce = debounce(logout, 1250)

// 营销助手H5跳转
export const navigatorToH5 = async ({ path, query }) => {
  const { useGetToken } = useUserStore()
  const { tokenDeadline, token, refreshToken, id } = useGetToken()
  const params = qs.stringify({
    ...query,
    isMiniProgram: 1,
    user_token: encodeURIComponent(JSON.stringify({ id, tokenDeadline, token, refreshToken })),
  })

  const url = `${import.meta.env.VITE_APP_WEB_BASE_URL}/#${path}?${params}`
  // const url = `http://10.20.102.41:5173/#${path}?${params}`
  navigator({ url: commonPath.H5_PATH, query: { url } })
}
