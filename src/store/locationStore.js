import { defineStore } from 'pinia'
import { getAddress } from '@/apis/common/system'

export default defineStore({
  id: 'locationStore',
  state() {
    return {
      location: {
        latitude: '',
        longitude: '',
      },
      position: {
        province: '',
        city: '',
        street: '',
        street_number: '',
      },
    }
  },
  actions: {
    useAuthorize: function (scope = 'scope.userLocation') {
      return new Promise((resolve, reject) => {
        uni.getSetting({
          success: (res) => {
            const { authSetting } = res
            if (!authSetting[scope]) {
              console.log('authorize')
              uni.authorize({
                scope,
                success: resolve,
                fail: () => reject(new Error(authSetting)),
              })
              return
            }
            resolve(res)
          },
          fail: () => reject(new Error({ action: 'error' })),
        })
      })
    },
    getLocation: async function (touch = false) {
      // 检查授权
      await new Promise((resolve, reject) => {
        uni.getSetting({
          async success(res) {
            if (!res.authSetting['scope.userLocation']) {
              if (touch) {
                const res = await uni.openSetting()
                if (res[0]) return reject(res[0])
                if (!res[1].authSetting['scope.userLocation']) {
                  return reject(new Error('未允许定位授权'))
                }
              } else {
                const scopeRes = await uni.authorize({
                  scope: 'scope.userLocation',
                })
                if (scopeRes.authError) {
                  return reject(new Error(scopeRes.authError))
                }
              }
            }
            resolve()
          },
          fail: reject,
        })
      })
      // 获取经纬
      const { latitude, longitude } = await uni.getLocation({
        type: 'gcj02',
      })
      this.location = { latitude, longitude }

      return {
        latitude,
        longitude,
      }
    },
    getPosition: async function (touch = false) {
      if (!(this.location.latitude && this.location.longitude)) {
        await this.getLocation(touch)
      }
      const { latitude, longitude } = this.location
      const { data } = await getAddress({ longitude, latitude })
      this.position = { ...data, ...this.location }
      return this.position
    },
  },
})
