import { defineStore } from 'pinia'

import { getMaterialList } from '@/apis/common/system'
import { processImage } from '@/utils/obsImageProcess'

export const useMaterialStore = defineStore('materialStore', {
  state: () => ({
    isIphoneX: false,
    resources: [],
    staticResource: [],
  }),
  getters: {
    getStaticResourceItem() {
      console.log(this.staticResource)
      const fileObj = this.staticResource?.['营销助手']
      return (dir) => {
        const dirList = dir.split('/')
        let findItem = fileObj
        for (let i = 0; i < dirList.length; i++) {
          findItem = findItem?.[dirList[i]]
        }
        return findItem
      }
    },
    getStaticResourceUrl() {
      return (dir) => {
        const findItem = this.getStaticResourceItem(dir)
        return findItem?.type === 1 ? processImage(findItem.url) : findItem?.url
      }
    },
  },
  actions: {
    async loadStaticResource() {
      const { data: list } = await getMaterialList({
        enable: 0,
        pageSize: 400,
        parentId: 0,
      })
      function deepTranslateListToObj(list) {
        const obj = {}
        list.forEach((item) => {
          if (item.commonMaterials) {
            obj[item.name] = deepTranslateListToObj(item.commonMaterials)
          } else {
            obj[item.name] = item
          }
        })
        return obj
      }
      this.staticResource = deepTranslateListToObj(list)
      // commit('setStaticResource', deepTranslateListToObj(list))
      // deepTranslateListToObj(list)
    },
  },
})
