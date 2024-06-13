import { http } from '@/apis/http'

// 存储用户获取积分事件
export const saveExchangeSign = (data) =>
  http({
    url: '/cd-sys-web/train/pointsGain/api/gain',
    data,
    method: 'POST',
  })

// 获取积分事件记录
/**
 * integralTypeId 积分类型ID
 * activityId 活动ID
 * behaviorId 行为ID
 * sourceChannel 平台/渠道 1010
 * userId 用户唯一标识
 * activityName 活动名称
 * **/
export const getExchangeLastSign = (data) => http({ url: '/marketing/record/getlist', data })

// 获取积分签到与否
export const getExchangeWidthSign = (data) =>
  http({
    url: '/marketing/eventrecord/checkEventRecord',
    data,
    method: 'POST',
  })

// 获取积分记录明细
export const getExchangeRecordDetail = (data) => http({ url: '/marketing/record/listpage', data })

// 获取积分商品列表
export const getExchangeGoods = (data) =>
  http({ url: '/marketing/commonactivitycommodity/listpage', data })

// 获取积分商品详情
export const getExchangeGoodDetail = (id) =>
  http({ url: `/marketing/commonactivitycommodity/detail/${id}` })

// 获取积分事件记录
export const getExchangeSignRecord = (data) =>
  http({ url: '/cd-sys-web/train/pointsGain/api/history', data })

// 获取积分排序
export const getExchangeIntegralSort = (data) =>
  http({ url: '/cd-sys-web/train/pointsGain/api/integralTop', data })

// 兑换积分商品
export const updateExchangeGoods = (data) =>
  http({ url: '/cd-sys-web/train/order/api/redeem', data, method: 'POST' })

// 获取兑换商品订单列表
export const getExchangeOrderList = (data) =>
  http({ url: '/cd-sys-web/train/order/api/orders', data })

// 获取兑换商品订单列表
export const editReceiveAddress = (data) =>
  http({
    url: '/cd-sys-web/train/order/api/modifyReceiveInfo',
    data,
    method: 'POST',
  })

// 获取兑换商品订单列表
export const receiveSucc = (data) =>
  http({
    url: '/cd-sys-web/train/order/api/confirmReceived',
    data,
    method: 'POST',
  })
