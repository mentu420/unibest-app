import { http } from '@/apis/http'
import { getAuthHeaders, getSystemCode } from '@/apis/common/auth'

// 使用账号密码获取用户数据，不验证账号是否失效
export const getOrdinary = (data) => {
  return http(
    {
      url: '/user/accountlogin/ordinary',
      method: 'POST',
      data: {
        systemCode: getSystemCode(),
        ...data,
      },
      header: {
        'content-type': 'application/x-www-form-urlencoded;charset=UTF-8',
        ...getAuthHeaders(),
      },
    },
    { withToken: false },
  )
}

// 获取账号数据
export const getUserData = (data) =>
  http(
    {
      url: '/user/account/getUserInfoByAccountPwd',
      method: 'POST',
      data: {
        systemCode: getSystemCode(),
        ...data,
      },
      header: {
        'content-type': 'application/x-www-form-urlencoded;charset=UTF-8',
      },
    },
    { withToken: false },
  )

// 获取用户信息
export const getUserInfo = (data) =>
  http({ url: '/cdapi/app/userinfo', data }, { withUserId: true })

// 记录用户最后登录数据
export const saveLastTime = (data) =>
  http({
    url: '/cdapi/app/update/lastlogintime',
    data,
  })

// 查询员工 所属经销商列表
export const getDealerShopList = (data) =>
  http({
    url: '/cdapi/shop/dealerShoplist',
    data,
  })

// 获取金蝶员工信息
export const getEmployeeInfo = (data) =>
  http(
    {
      url: '/datasync/app/employee/getEmployeeInfo',
      data,
    },
    { withToken: false },
  )

// 获取金蝶员工信息
export const setEmployeeAccount = (data) =>
  http(
    {
      url: '/datasync/app/employee/createOrBinding',
      data,
      method: 'POST',
      header: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
    },
    { withToken: false },
  )

// 根据账号查询用户手机号
export const getUserPhone = (data) =>
  http({ url: '/cdapi/app/abridge/user', data }, { withToken: false })

// 用户职位列表
export const getPositionMap = (data) => http({ url: '/cdapi/position/getPositionMap', data })

// 查询客户参考系
export const getReferenceList = (data) =>
  http({
    url: '/consumer-admin/dl/reference/list',
    data,
  })

// 根据经销商列表获取用户id
export const shopUserList = (data) =>
  http({
    url: '/cdapi/app/shopUserList',
    data,
  })

// 修改密码
export const udpatePassword = (data) => {
  return http(
    {
      url: '/cd-sys-web/v1/app/password',
      data,
      method: 'POST',
      header: {
        'content-type': 'application/x-www-form-urlencoded;charset=UTF-8',
      },
    },
    { withUserId: true },
  )
}

// 获取版本更新列表
export const getAppVersion = (data) => http({ url: '/consumer-admin/api/appEditionLog/list', data })

// 获取版本更新列表
export const getAppVersionItem = (data) =>
  http({ url: '/consumer-admin/api/appEditionLog/info', data })

// 查询履历
export const getCredentials = (data) =>
  http({
    url: '/consumer-admin/api/train/repository/v1/getroster',
    data,
  })

// 设置用户当前职位
export const updateUserInfo = (data) =>
  http(
    {
      url: '/cdapi/app/user/update',
      data,
      method: 'POST',
    },
    {
      withUserInfoFn({ userId }) {
        return { id: userId }
      },
    },
  )

// 查询经销商授权品牌信息
export const getDealerBrandDetail = (data) =>
  http({
    url: '/cdapi/shop/brand/shopBrandModel',
    data,
  })

// 请求门店单列表
export const getShopList = (data) =>
  http({ url: '/cd-sys-web/v1/api/writeofforder/shopList', data })

// 请求用户的店铺详细地址
export const getShopSideList = (data) =>
  http({ url: '/cd-sys-web/v1/api/writeofforder/channelSideList', data })

// 验证码修改密码
export const editUserPassword = (data) =>
  http(
    {
      url: '/cdapi/app/updatePwd',
      data,
      method: 'POST',
      header: {
        'content-type': 'application/x-www-form-urlencoded;charset=UTF-8',
      },
    },
    { withToken: false },
  )

// 获取短信验证码
export const fetchSms = (data) =>
  http(
    {
      url: '/cdapi/app/send',
      data,
      method: 'POST',
      header: {
        'content-type': 'application/x-www-form-urlencoded;charset=UTF-8',
      },
    },
    { withToken: false },
  )

// 获取短信验证码 金蝶登录
export const sendSms = (data) =>
  http({ url: '/commonservice/sms/identifysend', data, method: 'POST' }, { withToken: false })

// 查询p3认证时间最近的详情
export const getP3Detail = () =>
  http(
    { url: '/cdapi/pthreetrainapprove/get' },
    {
      withUserInfoFn({ account }) {
        return { loginAccount: account }
      },
    },
  )

// 查询金蝶登录信息
export const getLoginAccountId = () => {
  return http(
    {
      url: '/dealermanage/employee/list',
    },
    {
      withUserInfoFn({ userId }) {
        return { loginAccountId: userId }
      },
    },
  )
}
// 记录用户操作app数据、定位、经销商、用户信息
export const saveUseAppRecord = (data) => {
  return http({
    url: '/dealermanage/employeegpslog/add',
    data,
    method: 'POST',
  })
}
// 扫码请求
export const onScenCertification = (data) =>
  http({
    url: '/cdapi/classictrainmanagementregisterinfo/app/add',
    data,
    method: 'POST',
  })
