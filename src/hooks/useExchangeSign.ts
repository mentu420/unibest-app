import dayjs from 'dayjs'

import * as ExchangeApis from '@/apis/exchange'
import { useUserStore } from '@/store'

/***
 * @behaviorId
 * 10101 每日签到
 * 10102 文章浏览
 * 10103 视频观看
 * 10104 直播签到
 * 10105 分享记录
 * 10106 回放记录
 * ***/

interface IExchangeSignParams {
  behaviorId: string
  target: string
}

// 签到行为
export const setExchangeSign = async (params: IExchangeSignParams) => {
  const { useGetToken } = useUserStore()
  const { id } = useGetToken()

  const { data } = await ExchangeApis.saveExchangeSign({
    userId: id,
    sourceChannel: 1010,
    ...params,
  })
  return data
}

// 获取行为记录
export const getExchangeEventDetail = async (params) => {
  const { useGetToken } = useUserStore()
  const { id } = useGetToken()
  if (!id) return
  const { data } = await ExchangeApis.getExchangeLastSign({
    userId: id,
    ...params,
  })
  return data
}

export const isToday = (date: Date | string) => {
  return dayjs().isSame(dayjs(date), 'day')
}

// 判断是否已经签到
export const isAlreadySigned = async (params) => {
  const { useGetToken } = useUserStore()
  const { id } = useGetToken()
  const { data } = await ExchangeApis.getExchangeWidthSign({
    source: id,
    sourceChannel: 1010,
    ...params,
  })
  return (data as { code: number }).code !== 0
}
