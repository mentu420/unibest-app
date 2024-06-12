import { getObsInfo } from '@/apis/common/system'
import { StorageEnum } from '@/enums/storage'
import { getStorage, setStorage } from '@/utils/storage'
import Crypto from 'crypto-js'
import dayjs from 'dayjs'
import { encode } from 'js-base64'

const getFormatDate = () => {
  return dayjs().format('YYYY-MM-DD')
}

export const getFileName = (url: string, originName?: string) => {
  const fileDir = url.split('?')[0]
  const fileDirSlice = fileDir.split('/')
  return originName || fileDirSlice[fileDirSlice.length - 1]
}

function initFileObj(originalName: string) {
  // 给文件名添加时间戳
  const nameArr = originalName.split('.')
  let ext = ''
  if (nameArr.length > 1) {
    ext = nameArr.pop() as string
  }
  nameArr.push(`${Date.now()}`)
  let name = nameArr.join('.')
  try {
    name = encode(encodeURIComponent(name))
  } catch (error) {
    name = Math.random().toString().substring(3, 10) + Date.now()
  }
  return {
    name: ext ? `${name}.${ext}` : `${name}`,
    ext,
  }
}

export const getObsConfig = async () => {
  const obsInfo = getStorage(StorageEnum.OBS_CONFIG_STORAGE)
  if (obsInfo && obsInfo.credential && new Date() < new Date(obsInfo.credential.expiresAt)) {
    return obsInfo
  }
  return getObsInfo().then((res) => {
    console.log(res.data)
    setStorage(StorageEnum.OBS_CONFIG_STORAGE, res.data.data)
    return res.data.data
  })
}

export const uploadFile = async (filePath: string, fileName?: string) => {
  const config = await getObsConfig()
  // 将文件名转换为base64，可选
  const uploadFileName = getFileName(filePath, fileName)
  const { name } = initFileObj(uploadFileName)
  const uploadFilePath = `mp-derucci-member/${getFormatDate()}/${name}`

  const OBSPolicy = {
    expiration: config.credential.expiresAt,
    conditions: [
      { bucket: config.bucketName }, // 桶名要和配置文件中endpoint中的桶名保持一致
      { 'x-obs-security-token': config.credential.securitytoken }, // 如果是临时访问秘钥鉴权，必须设置该值
      { key: uploadFilePath },
    ],
  }
  const policy = encode(JSON.stringify(OBSPolicy))
  const signature = Crypto.enc.Base64.stringify(Crypto.HmacSHA1(policy, config.credential.secret))

  return new Promise((resolve, reject) => {
    uni.uploadFile({
      url: config.bucketDomain,
      filePath,
      header: {
        'content-type': 'multipart/form-data; boundary=-9431149156168',
      },
      name: 'file',
      formData: {
        AccessKeyID: config.credential.access,
        policy,
        signature,
        key: uploadFilePath,
        // 如果是临时访问秘钥鉴权，必须设置该值
        'x-obs-security-token': config.credential.securitytoken,
      },
      success(e) {
        if (e.statusCode === 204) {
          resolve(`${config.bucketDomain}/${uploadFilePath}`)
        } else {
          reject(e)
        }
      },
      fail: reject,
    })
  })
}
