import { http } from '@/apis/http'

// ------------------云学堂首页-----------------------

// 获取首页轮播图
export const getHomeBanner = (data) =>
  http({
    url: '/consumer-admin/api/train/repository/v1/adverts',
    data,
  })

// 获取菜单导航
export const getStudyHomeCategory = (data) =>
  http({
    url: '/consumer-admin/api/train/repository/v1/category',
    data,
  })

// 获取置顶文章
export const getTopRepositor = (data) =>
  http({
    url: '/consumer-admin/api/train/repository/v1/getTopRepository',
    data,
  })

// 获取云学堂导航分类
export const getStudyCategories = (data) =>
  http({
    url: '/consumer-admin/train/category/list',
    data,
  })

// ------------------直播-----------------------
// 获取直播列表
export const getLiveList = (data, customOptions) =>
  http(
    {
      url: '/consumer-admin/api/live/cd/train/list',
      data,
    },
    customOptions,
  )
// 获取置顶回放列表
export const getReplayTopList = (data) =>
  http({
    url: '/consumer-admin/api/live/cd/train/getReplayTopList',
    data,
  })

// ------------------培训报名-----------------------
// 获取培训报名支付信息
export const getTrainPayInfo = (data) =>
  http({
    url: '/cdapi/apply/apply',
    data,
    method: 'POST',
  })

// 获取培训报名支付参数
export const getTrainPayData = (data) =>
  http({
    url: '/cdapi/apply/pay',
    data,
    method: 'POST',
  })
// 获取云学堂弹窗
export const getSlideShowInfo = (data) =>
  http({
    url: '/member/slideshowinfo/listpage',
    data,
  })
