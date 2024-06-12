// 验证文本框输入
export const textReg =
  /[^a-zA-Z0-9\u4E00-\u9FA5\\:：.,；;。，、……|%￥$#?？`·~^()（）《》*【】'‘’"“”{}_\-——=@！!+↵/s/\n/\r]/g
// 中文姓名或英文姓名
export const nameReg = /^(?:[\u4e00-\u9fa5·]{2,16}|[a-zA-Z]{1}[a-zA-Z\s]{0,20}[a-zA-Z]{1})$/
// 数字/货币金额（支持负数、千分位分隔符）
export const moneyReg =
  /(?:^[1-9]([0-9]+)?(?:\.[0-9]{1,2})?$)|(?:^(?:0){1}$)|(?:^[0-9]\.[0-9](?:[0-9])?$)/
// 中国手机号(宽松), 只要是13,14,15,16,17,18,19开头即可
export const phoneReg = /^(?:(?:\+|00)86)?1[3-9]\d{9}$/
// 网址(支持端口和"?+参数"和"#+参数)
export const websiteReg =
  /^(((ht|f)tps?):\/\/)?[\w-]+(\.[\w-]+)+([\w\-.,@?^=%&:/~+#]*[\w\-@?^=%&/~+#])?$/
// 验证微信号，2-20个字母、数字、下划线和减号，必须字母开头部分大小写
export const wechatReg = /^[a-zA-Z]([-_a-zA-Z0-9]{5,19})+$/
// 中英文、数字和空格
export const cnWidthEnReg = /^[\u4e00-\u9fa5\u0020_a-zA-Z0-9]+$/
// 汉字名称
export const chineNameReg = /^[\u4e00-\u9fa5·]{2,16}$/
// 密码
export const passwordReg = /^(?![0-9]+$)(?![a-zA-Z]+$)[0-9A-Za-z]{6,18}$/

export function vaildText(value) {
  textReg.lastIndex = 0
  return textReg.test(value)
}

export function vaildName(value) {
  nameReg.lastIndex = 0
  return nameReg.test(value)
}

export function vaildMoney(value) {
  moneyReg.lastIndex = 0
  return moneyReg.test(value)
}

export function vaildPhone(value) {
  phoneReg.lastIndex = 0
  return phoneReg.test(value)
}

export function vaildWebsite(value) {
  websiteReg.lastIndex = 0
  return websiteReg.test(value)
}

export function vaildWechat(value) {
  wechatReg.lastIndex = 0
  return wechatReg.test(value)
}

export function vaildCnWidthEn(value) {
  cnWidthEnReg.lastIndex = 0
  return cnWidthEnReg.test(value)
}
// 验证百家姓。1：是汉字并且符合百家姓
export function vaildChineName(value) {
  chineNameReg.lastIndex = 0
  return chineNameReg.test(value)
}

export function validPassword(value) {
  passwordReg.lastIndex = 0
  return passwordReg.test(value)
}
