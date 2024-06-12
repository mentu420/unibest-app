import { http } from '@/apis/http'

// 发送验证码
export const sendSms = (data) =>
  http(
    { url: '/consumer-admin-sms/consumermanage/sms/send', data, method: 'POST' },
    { withToken: false },
  )

// 校验验证码
export const validatorSmsCode = (data) =>
  http(
    {
      url: '/consumer-admin-sms/consumermanage/sms/verifySnsCode',
      data,
      method: 'POST',
    },
    { withToken: false },
  )

// 获取公告阅读记录数据
export const getNoticeRecord = (data) =>
  http(
    {
      url: '/cd-sys-web/v3/app/notice/reading/list',
      data,
    },
    { withUserId: true },
  )

// 获取用户openId
export const getOpenId = (data) =>
  http({
    url: '/consumer-admin/v1/api/wxuser/getOpenId',
    data,
    method: 'POST',
    header: { 'content-type': 'application/x-www-form-urlencoded' },
  })

// 获取培训订单
export const getTrainPayOrder = (data) =>
  http({
    url: '/cdapi/apply/pay',
    data,
    method: 'POST',
  })

// 获取直播订单
export const getLivePayOrder = (data) =>
  http({
    url: '/cdapi/livehistorypay/pay',
    data,
    method: 'POST',
    header: { 'content-type': 'application/x-www-form-urlencoded' },
  })

// 获取静态资源
export const getMaterialList = (data) =>
  http(
    {
      url: '/consumermanage/material/list',
      data: {
        pageSize: 1,
        systemCode: 40,
        // type: 1,
        enable: 0,
        ...data,
      },
    },
    { withToken: false },
  )

// 获取运营平台参数管理列表
export const getSysConfigList = (data) =>
  http(
    {
      url: '/consumer-admin/sys/config/list',
      data,
    },
    { withToken: false },
  )

// 获取运营平台参数 多key
export const getSystemParamsByKeys = (data) =>
  http(
    {
      url: '/consumer-admin/sys/config/getListByKeys',
      data,
    },
    { withToken: false },
  )

// 经纬度解析
export const getAddress = (data) =>
  http({
    url: '/commonservice/app/cityinfo/get',
    data,
  })
