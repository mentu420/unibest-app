import { getProductBrands } from '@/apis/discovery/home'
import { getDealerBrandDetail } from '@/apis/common/user'
import { useUserStore } from '@/store/'

// 营销助手:根据用户id获取经销商授权业绩系列
export const getDealCategoryList = async () => {
  const { useGetToken } = useUserStore()
  const { id } = useGetToken()
  const { data = [] } = await getDealerBrandDetail({ userId: id })
  return data.map((item) => ({
    brand: item.brand,
    text: item.aliasBrand,
    code: item.brandCode,
    parentCode: item.parentCode,
    parentName: item.parentName,
  }))
}

export const useBrandPower = async (params) => {
  const { page = {} } = await getProductBrands({
    page: 1,
    limit: 500,
    enable: true,
    brandLevel: 2,
    appDisplay: 1,
    ...params,
  })

  return page?.list || []
}

/**
 * 获取经销商授权品牌业绩数据，再与运营平台业绩系列做交集
 * 1：营销助手产品图库列表查询品牌brand
 * **/
export const getMarketBrandPower = async () => {
  const brandList = await useBrandPower({})
  const marketCategoryList = await getDealCategoryList()
  // 营销助手过滤不显示的系列
  return marketCategoryList.filter((item) =>
    brandList.some((categoryItem) => categoryItem.brandCode === item.code),
  )
}
