import { http } from '@/apis/http'

// 订单查询
export const getOrderList = (data) =>
  http(
    {
      url: '/cd-sys-web/v3/app/order/list',
      data,
    },
    { withUserId: true },
  )

// 工作台查询用户业绩
export const getWorkAchievement = (data, customOptions) =>
  http(
    {
      url: '/cd-sys-web/v3/app/workbench',
      data,
    },
    customOptions,
  )

// 工作台查询用户记录
export const getWorkPlan = (data, customOptions) =>
  http(
    {
      url: '/cd-sys-web/v3/app/workplan/workplanlist',
      data,
    },
    customOptions,
  )
// 请求核销商品详情
export const getGoodsVerification = (data) =>
  http({
    url: '/cd-sys-web/v1/api/writeofforder/list',
    data,
  })

// 请求卡卷核销详情
export const getCardDetail = (data) => {
  return http({
    url: '/cd-sys-web/goodsWriteOffMember/cardRoll',
    data,
    header: {
      'content-type': 'application/x-www-form-urlencoded;charset=UTF-8',
    },
  })
}

// 商品核销
export const writeOff = (data) => {
  return http({
    url: '/cd-sys-web/v1/api/writeofforder/writeoff',
    method: 'POST',
    data,
  })
}

// 卡卷核销
export const writeOffCard = (data) => {
  return http({
    url: '/cd-sys-web/goodsWriteOffMember/save',
    data,
    method: 'POST',
  })
}

// 获取商机报表
export const getBusinessReportForm = (data) =>
  http({ url: '/cd-sys-web/v3/app/workbench/opportunitystatistic', data, method: 'POST' })

// 反馈获取总部是否回复
export const checkFeedbackReply = (editUserId) =>
  http({
    headers: { 'Cache-Control': 'no-cache' },
    url: `/consumermanage/appessay/terminalFeedbackCheckIsNotView/${editUserId}`,
    data: {
      timestamp: +new Date(),
    },
  })
