export enum StorageEnum {
  TOKEN = 'TOKEN',
  WW_TOKEN = 'WW_TOKEN',
  USER = 'USER',
  MEMBER = 'MEMBER',
  LOCATION = 'LOCATION',
  MARKETING = 'MARKETING',
  OBS_CONFIG_STORAGE = 'OBS_CONFIG_STORAGE',
  TAB_BAR_Query = 'TAB_BAR_Query',
  CLOST_EXCHANGE_SIGN = 'closeExchangeSign',
  STUDY_NOTICE_CLOSE = 'studyNoticeClose',
  ACCOUNT = 'account',
  SYSTEM_CODE = 'SYSTEM_CODE',
  SCOPE_USER_LOCATION = 'scopeUserLocation',
}

export type StorageKey =
  | 'TOKEN'
  | 'WW_TOKEN'
  | 'USER'
  | 'MEMBER'
  | 'LOCATION'
  | 'MARKETING'
  | 'OBS_CONFIG_STORAGE'
  | 'TAB_BAR_Query'
  | 'closeExchangeSign'
  | 'studyNoticeClose'
  | 'account'
  | 'SYSTEM_CODE'
  | 'scopeUserLocation'

export interface User {
  account: string
  createTime: string
  id: string
  nickName: string
  openId: string
  phone: string
  realName: string
}
