/*
 * @Author: wangmq
 * @Date: 2024-03-15 15:55:59
 * @LastEditors: MacBook-Pro-5.local
 * @LastEditTime: 2024-03-27 11:32:03
 */
import { decode, encode } from 'js-base64'
import qs from 'qs'

export const getCurrRoute = () => {
  const pages = getCurrentPages()
  const current = pages[pages.length - 1]
  return current
}

// Promise 版modal
export const showModal = (
  content: string,
  { showCancel, title, ...options }: UniApp.ShowModalOptions = {},
) => {
  return new Promise((resolve, reject) =>
    uni.showModal({
      showCancel: showCancel === true,
      title: title || '提示',
      ...options,
      content,
      success(e) {
        if (e.confirm) {
          return resolve(e)
        }
        reject(e)
      },
      fail: reject,
    }),
  )
}

// 合并Promise请求
export function mergingStep<T = any>(wrapped: (...rest: any) => Promise<any>) {
  let runningInstance: Promise<T> | null = null
  return function (this: ThisParameterType<T>, ...args: any[]) {
    if (runningInstance) {
      // 若步骤正在进行，则监听并使用其执行结果，而不是重新发起该步骤
      return runningInstance
    }
    const res = wrapped.apply(this, args)

    if (!(res instanceof Promise)) {
      return res
    }
    runningInstance = res
    runningInstance
      .then(function () {
        runningInstance = null
      })
      .catch(function () {
        runningInstance = null
      })
    return runningInstance
  }
}

// 防抖
export const debounce = <T extends (...args: any[]) => any>(fn: T, delay: number) => {
  let timer: ReturnType<typeof setTimeout> | null = null
  return function (this: ThisParameterType<T>, ...args: Parameters<T>) {
    clearTimeout(timer)
    timer = setTimeout(() => {
      fn.apply(this, args)
    }, delay)
  }
}

/**
 * throttle节流函数定义：就是无论频率多快，每过一段时间就执行一次。 https://juejin.cn/post/6844903863061839885
 * @param fn  要执行的函数
 * @param delay 延迟的时间
 */
export const throttle = <T extends (...args: any[]) => any>(fn: T, delay: number) => {
  // previous 是上一次执行 fn 的时间
  // timer 是定时器
  let previous: number = 0
  let timer: ReturnType<typeof setTimeout> | null = null
  // 将 throttle 处理结果当作函数返回
  return function (this: ThisParameterType<T>, ...args: Parameters<T>) {
    // 获取当前时间，转换成时间戳，单位毫秒
    const now: number = +new Date()

    // ------ 新增部分 start ------
    // 判断上次触发的时间和本次触发的时间差是否小于时间间隔
    if (now - previous < delay) {
      // 如果小于，则为本次触发操作设立一个新的定时器
      // 定时器时间结束后执行函数 fn
      if (timer) clearTimeout(timer)
      timer = setTimeout(() => {
        previous = now
        fn.apply(this, args)
      }, delay)
      // ------ 新增部分 end ------
    } else {
      // 第一次执行
      // 或者时间间隔超出了设定的时间间隔，执行函数 fn
      previous = now
      fn.apply(this, args)
    }
  }
}

// 手机号码加密
export const displayPhone = (value = '', replace = '$1****$2') => {
  if (!value) {
    return
  }
  return value.replace(/(\d{3})\d{4}(\d{4})/, replace)
}

// 拼接字符串
export const joinStr = (...args) => {
  return args.reduce((acc, cur) => {
    return acc + (cur || '')
  }, '')
}

export const onLoadOptions2Obj = (options) => {
  let querys = options
  if (options.q) {
    try {
      const searchStr = decodeURIComponent(options.q).split('?')[1]
      querys = qs.parse(searchStr)
    } catch (e) {
      console.warn(e)
    }
  }
  return (key) => {
    if (querys[key]) {
      return querys[key]
    }
    return ''
  }
}
// 判断字符串为base64
export function checkBase64(text) {
  // 运营平台传来的base64会将'+'转成‘--’
  try {
    const standardBase64Text = String(text).replace(/--/g, '+')
    if (standardBase64Text.length % 4 === 0) {
      // 检查是否为base64常用编码
      if (
        /^([A-Za-z0-9+/]{4})*([A-Za-z0-9+/]{4}|[A-Za-z0-9+/]{3}=|[A-Za-z0-9+/]{2}==)$/.test(
          standardBase64Text,
        )
      ) {
        // 如果解码再编码能与原数据一致，则判断为base64
        if (standardBase64Text === encode(decode(standardBase64Text))) {
          return true
        }
      }
    }
    return false
  } catch (error) {
    console.log(error)
    return false
  }
}
// 转码的时候特殊字符除掉
export function htmlDecode(text) {
  let str = text
  if (checkBase64(text)) {
    str = text.replace(/--/g, '+')
    str = decode(str)
  }
  return str || ''
}

export function getQueryValue(options) {
  let query = options
  // 普通二维码识别参数
  if (options.q) {
    try {
      query = qs.parse(decodeURIComponent(options.q).split('?')[1])
    } catch (e) {
      console.log(e)
    }
  }
  // 小程序码识别参数
  if (options.scene) {
    try {
      query = qs.parse(decodeURIComponent(options.scene))
    } catch (e) {
      console.log(e)
    }
  }
  return (key) => {
    if (query[key]) {
      return query[key]
    }
    if (!key) {
      return query
    }
    return ''
  }
}

// 生成随机数
export const randomString = (len) => {
  len = len || 32
  const $chars = '012345678'
  const maxPos = $chars.length
  let pwd = ''
  let i = 0
  for (i = 0; i < len; i++) {
    pwd += $chars.charAt(Math.floor(Math.random() * maxPos))
  }
  return pwd
}

/**
 * @description: 金钱格式转化
 * @param {number} money 金额
 * @return {string} 已转化金额文本
 */
export const moneyFormat = (money: number) => {
  const valueStr = `¥${money?.toFixed(2) || ''}`
  return valueStr
}
