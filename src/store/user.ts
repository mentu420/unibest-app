import { defineStore } from 'pinia'
import { reactive, ref } from 'vue'

import * as UserApi from '@/apis/common/user'
import { mergingStep } from '@/utils/common'
import { getStorage, removeStorage, setStorage } from '@/utils/storage'
import { StorageEnum } from '@/enums/storage'

export const useUserStore = defineStore(
  'user',
  () => {
    // 微信登录获取token
    const useGetWechatToken = () => getStorage(StorageEnum.WW_TOKEN)
    const useSetWechatToken = (value: any) => setStorage(StorageEnum.WW_TOKEN, value)
    const useRemoveSetWechatToken = () => removeStorage(StorageEnum.WW_TOKEN)

    // 统一接口token处理
    const useGetToken = () => getStorage(StorageEnum.TOKEN)
    const useSetToken = (value: any) => setStorage(StorageEnum.TOKEN, value)
    const useRemoveToken = () => removeStorage(StorageEnum.TOKEN)

    // 职位权限
    const userPowerList = ref([
      { id: 0, codes: ['Dealer Boss', 'Professional Manager'] },
      { id: 1, codes: ['Store Manager', 'Virtual Store Manager'] },
      { id: 2, codes: ['Sleep Consultant', 'KIS Test Position Type'] },
      { id: 3, codes: ['Marketing Supervisor'] },
      { id: 5, codes: ['Regional Manager', 'Market Manager'] },
    ])

    const userInfo = ref(null) // 用户信息
    const dealerList = ref(null) // 经销商列表
    const roleList = ref(null) // 职位列表信息

    // 判断用户权限，并存储之后使用
    const setPositionPower = (data) => {
      const { positionList, crmAccount, type } = data
      if (positionList.length === 0 && crmAccount === 0 && type === 1) {
        return { ...data, powers: [4] }
      }

      const powerList = positionList.map((item) => {
        const powerItem = userPowerList.value.find((powerItem) =>
          powerItem.codes.includes(item.positionType),
        )
        const power = powerItem ? powerItem.id : 4 // 如果存在则配置权限，否则默认为4
        return { ...item, power }
      })
      // 权限
      const powers = [...new Set(powerList.map((item) => item.power))]
      return { ...data, positionList: powerList, powers }
    }

    const setUserInfo = (palyload) => (userInfo.value = palyload)

    // 返回userInfo
    const useUserInfoSync = mergingStep(async (values = {}) => {
      const { reload = false } = values
      if (userInfo.value && !reload) return userInfo.value
      const { id } = useGetToken()
      const { data } = await UserApi.getUserInfo({ virtualStore: 1, userId: id })
      setUserInfo(setPositionPower(data))
      return userInfo.value
    })

    // 获取职位键对值列表
    const getReferenceList = async () => {
      const { data } = await UserApi.getReferenceList({
        type: 'POSITION_TYPE',
      })
      const list = data
        .map((item) => ({ code: item.code, text: item.code_text, id: item.id }))
        .map((item) => {
          const powerItem = userPowerList.value.find((powerItem) =>
            powerItem.codes.includes(item.code),
          )
          const power = powerItem ? powerItem.id : 4 // 如果存在则配置权限，否则默认为4
          return { ...item, power }
        })
      return list
    }

    // 职位合并去重 重复职位只获取enable = true
    const setPositionList = (arr) => {
      const positionCrmIds = [...new Set(arr.map((item) => item.positionCrmId))]
      return positionCrmIds
        .map((crmId) => {
          const positionList = arr.filter((item) => item.positionCrmId === crmId)
          if (positionList.length === 0) return [positionList]
          const enableItem = positionList.filter((item) => item.enable)
          return enableItem.length === 0
            ? positionList[0]
            : enableItem.length > 1
              ? enableItem[0]
              : enableItem
        })
        .flat()
    }
    // 获取当前职位所属经销商信息（门店信息、职位信息）
    const useRoleListSync = async (params = {}) => {
      const { reload = false } = params
      if (roleList.value && !reload) return roleList.value
      const { id } = useGetToken()
      const positionMap = await getReferenceList() // 获取职位列表
      const { data = [] } = await UserApi.getPositionMap({ userId: id }) // 获取经销商门店列表
      roleList.value = data
        .filter((item) => ['New', 'Active'].includes(item.shopStatus))
        .map((item) => {
          const list = item.positionList.map((option) => {
            const powerItem = positionMap.find(
              (powerItem) => powerItem.text === option.positionName,
            )
            return { ...option, power: powerItem?.power, positionTypes: powerItem?.code }
          })
          return {
            ...item,
            positionList: setPositionList(list),
          }
        })
      return roleList.value
    }

    // 获取当前职位所属经销商信息 //positionId
    // @params {reload} 是否重新加载
    const useDealerInfoSync = mergingStep(async (params) => {
      const dealerList = await useRoleListSync(params)
      const { primaryPositionId } = await useUserInfoSync(params)
      // orgType Dealer 为经销商 dealerNo、shopNo相同
      return dealerList.find((dealerItem) =>
        dealerItem.positionList.some(
          (positionItem) => positionItem.positionId === primaryPositionId,
        ),
      )
    })

    // 获取当前职位信息
    const useCurrentPositionSync = async () => {
      const result = userInfo.value ? userInfo.value : await useUserInfoSync()
      return result.positionList.find((item) => item.positionId === result.primaryPositionId)
    }

    // 获取当前职位权限
    const useUserPowerSync = async () => {
      const result = await useCurrentPositionSync()
      return result?.power
    }

    /**
     * 传positionId 进入 检查是否有效，最后切换职位更新用户信息
     * 1：positionId 存在并有效为切换职位
     * 2：positionId 不存在时自动设置默认职位
     * **/
    const useUserPositionSwitch = async (positionId) => {
      const { positionList, primaryPositionId } = userInfo.value
        ? userInfo.value
        : await useUserInfoSync()
      // 使用门店状态有效的门店职位进行对比
      const shopActiveList = positionList.filter((item) =>
        ['New', 'Active'].includes(item.shopStatus),
      )
      // 检查positionId是否有效
      const bool = shopActiveList.some((positionItem) => positionItem.positionId === positionId)
      let newPrimaryPositionId = null
      if (bool) {
        // positionId 有效,判断是否已经设置为当前职位
        if (positionId && positionId === primaryPositionId && /^[0-9]*$/.test(positionId)) return
        newPrimaryPositionId = positionId
      } else {
        // 无效, 设置有效门店默认职位
        if (shopActiveList.length > 0) newPrimaryPositionId = shopActiveList[0].positionId
      }
      if (!newPrimaryPositionId) return

      const res = await UserApi.updateUserInfo({ primaryPositionId: newPrimaryPositionId })
      userInfo.value = { ...userInfo.value, primaryPositionId: newPrimaryPositionId }
      setUserInfo(userInfo.value)
      return res
    }

    // 清空用户相关数据
    const useClearUserStore = () => {
      userInfo.value = null
      dealerList.value = null
      roleList.value = null
      useRemoveToken()
      useRemoveSetWechatToken()
    }

    return {
      userInfo,
      dealerList,
      userPowerList,
      setUserInfo,
      useUserInfoSync,
      useDealerInfoSync,
      useUserPowerSync,
      useGetToken,
      useSetToken,
      useRemoveToken,
      useRoleListSync,
      useClearUserStore,
      useCurrentPositionSync,
      useUserPositionSwitch,
      useGetWechatToken,
      useSetWechatToken,
      useRemoveSetWechatToken,
    }
  },
  {
    persist: true,
  },
)
