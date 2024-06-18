import md5 from 'js-md5'
import { fetchSettoken } from '@/apis/common/auth'
import * as UserApi from '@/apis/common/user'
import { useUserStore } from '@/store/'
import { logout } from '@/utils/navigator'

// 检查职位、经销商、门店状态
export const useUserLoginCheck = ({ shopList = [], status }) => {
  // 1:检查账号是否有效status===ACTIVE
  // 2:检查shopList列表中status==Active || New
  if (status !== 'ACTIVE') return false
  const statusList = ['New', 'Active']
  return shopList.some((shopItem) => statusList.includes(shopItem.status))
}
/**
 * 检查primaryPositionId 是否异常，primaryPositionId必须在positionList列表中存在的 positionId
 * 获取用户个人信息
 * **/
export const onLoginWithUserInfo = async (redirect = true) => {
  const { useUserInfoSync, useUserPositionSwitch } = useUserStore()
  const userInfo = await useUserInfoSync({ reload: true })
  if (!useUserLoginCheck(userInfo)) {
    logout('账号已失效（职位/门店/经销商），不能登录！', redirect)
    throw new Error('账号已失效（职位/门店/经销商），不能登录！')
  }
  // 使用门店状态有效的门店职位进行对比
  const { userId, primaryPositionId } = userInfo
  await useUserPositionSwitch(primaryPositionId)
  // 更新用户登录时间点
  UserApi.saveLastTime({ userId })
}
// 账号密码登录
export const accountLogin = async ({ account, password }) => {
  const { useSetToken } = useUserStore()
  const { code, data, msg } = await UserApi.getOrdinary({
    account,
    password: md5(password),
  })
  if (code !== 0) throw new Error(msg)
  console.log('accountLogin', data)
  useSetToken(data)
  // 获取用户信息后跳转首页
  if (account !== '1000000') await onLoginWithUserInfo()
}

/**
 * @params params 登录参数
 * @params redirect 登录失败是否重定向到登录页
 * **/
export const forceLogin = async (params, redirect) => {
  await fetchSettoken(params)
  // 获取用户信息后跳转首页
  await onLoginWithUserInfo(redirect)
}
