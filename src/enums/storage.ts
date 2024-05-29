export enum StorageEnum {
  TOKEN = 'TOKEN',
  USER = 'USER',
  MEMBER = 'MEMBER',
  LOCATION = 'LOCATION',
  MARKETING = 'MARKETING',
  OBS_CONFIG_STORAGE = 'OBS_CONFIG_STORAGE',
  TAB_BAR_Query = 'TAB_BAR_Query',
}

export type StorageKey =
  | 'TOKEN'
  | 'USER'
  | 'MEMBER'
  | 'LOCATION'
  | 'MARKETING'
  | 'OBS_CONFIG_STORAGE'
  | 'TAB_BAR_Query'

export interface User {
  account: string
  createTime: string
  id: string
  nickName: string
  openId: string
  phone: string
  realName: string
}
