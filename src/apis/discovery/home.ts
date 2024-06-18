import { http } from '@/apis/http'

// ------------------发现首页-----------------------

// 获取图库商品列表
export const getGalleryGoodsList = (data, customOptions) =>
  http(
    {
      url: '/consumer-admin/api/product/v1/product/list',
      data,
    },
    customOptions,
  )

// 品牌系列
export const getProductBrands = (data) => {
  return http({
    url: '/consumer-admin/goods/brandintroduce/listpage',
    data,
  })
}
