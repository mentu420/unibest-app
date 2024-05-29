import store from '@/store'
import qs from 'qs'

import { showModal } from './common'

// 无需鉴权页面，直接跳转
export const authWhitePages = [
  // auth
  '/pages/index/auth',
]

export const switchPages = [
  '/pages/home/home',
  '/pages/index/group',
  '/pages/index/wallet',
  '/pages/index/my',
  '/pages/me/mePage',
]

export const urlCheck = (urlList, url) => {
  url = url.split('?')[0]
  return urlList.some((_url) => {
    return _url.includes(url)
  })
}
export const isWhiteUrl = (url = '') => {
  return urlCheck(authWhitePages, url)
}

export const toAuth = () => {
  navigator({
    url: '/pages/home/home',
  })
}

export const toLoginWithRedirect = () =>
  navigator({
    url: '/pages/login/index',
  })

export const isTabbarUrl = (url = '') => {
  return urlCheck(switchPages, url)
}

export const checkIsWebURL = (url) => url.indexOf('http') === 0

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
    // switch (type) {
    //   case 'navigateTo':
    //     uni.navigateTo(options)
    //     break;
    //   case 'redirectTo':
    //     uni.redirectTo(options)
    //     break;
    //   case 'reLaunch':
    //     uni.reLaunch(options)
    //     break;
    //   case 'switchTab':
    //     uni.switchTab(options)
    //     break;
    // }
    uni[type](options)
  } catch (error) {
    showModal('Jump failed, please try again later')
  }
}
