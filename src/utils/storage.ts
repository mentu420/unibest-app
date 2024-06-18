import type { StorageEnum } from '@/enums/storage'

type StorageKey = StorageEnum

const platName = `${import.meta.env.VITE_APP_TITLE}_${String(
  import.meta.env.MODE,
).toLocaleUpperCase()}_`
const platKey = (key: StorageKey) => platName + key
const isJSON = (value: string): boolean => /^{(.?)+}$/.test(value) || /^\[(.?)+\]$/.test(value)

export const getStorage = <T = any>(key: StorageKey, isPlat = true): T => {
  const value = uni.getStorageSync(isPlat ? platKey(key) : key)
  if (isJSON(value)) {
    try {
      return JSON.parse(value)
    } catch (err) {
      return value
    }
  }
  return value
}

export const removeStorage = (key: StorageKey, isPlat = true) => {
  uni.removeStorageSync(isPlat ? platKey(key) : key)
}

export const setStorage = (key: StorageKey, value, isPlat = true) => {
  if (!key) {
    return
  }
  uni.setStorageSync(
    isPlat ? platKey(key) : key,
    typeof value === 'object' ? JSON.stringify(value) : value,
  )
}
