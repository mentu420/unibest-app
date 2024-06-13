/*
 * @Author: wangmq
 * @Date: 2023-09-25 14:28:48
 * @LastEditors: MacBook-Pro-5.local
 * @LastEditTime: 2024-03-22 14:55:06
 */
export function getDeviceInfo() {
  let support = false
  let pixelRatio = 2
  try {
    const getSystemInfoSync = uni.getSystemInfoSync()
    const platform = getSystemInfoSync.platform
    const system = getSystemInfoSync.system
    pixelRatio = getSystemInfoSync.pixelRatio
    const versionResult = /[0-9.]*$/.exec(system)
    const systemVersion = versionResult ? versionResult[0] : ''
    const iosSystemSupport = platform === 'ios' && !!systemVersion && parseFloat(systemVersion) > 14

    support = platform === 'devtools' || platform === 'android' || iosSystemSupport
  } catch (e) {
    console.log(e)
  }

  return {
    supportWebp: support,
    pixelRatio,
  }
}
export const deviceInfo = getDeviceInfo()

export function processImage(url: string, max_width = 375) {
  // 华为obs
  const isObsUrl = /obs.iderucci.com/.test(url)
  const isProcess = /\?/.test(url)
  const isGif = /\.gif/.test(url)
  if (isObsUrl && !isProcess && !isGif) {
    let commonProcess = url
    if (deviceInfo.supportWebp) {
      commonProcess += `?x-image-process=image/resize,w_${
        Math.ceil(max_width * deviceInfo.pixelRatio) || 375 * 3
      }/format,webp/imageslim`
    }
    return commonProcess
  }
  return url
}
