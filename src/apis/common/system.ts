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

// 获取用户openId
export const getOpenId = (data) =>
  http({
    url: '/consumer-admin/v1/api/wxuser/getOpenId',
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
        systemCode: 40,
        // type: 1,
        enable: 0,
        pageSize: 400,
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

// 华为obs配置
export function getObsInfo(data?: any) {
  return http(
    {
      url: '/consumermanage/api/createTemporaryAccess',
      data,
    },
    {
      responseType: 'original',
    },
  )
}

// 获取公告阅读记录数据
export const getNoticeRecord = () =>
  http(
    {
      url: '/cd-sys-web/v3/app/notice/reading/list',
    },
    { withUserId: true },
  )
