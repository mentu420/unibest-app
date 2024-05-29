import * as UserApi from '@/apis/common/user'
import { ref } from 'vue'

// 发送短信
export const useSMS = () => {
  const graphicImage = ref('')

  // 发送短信
  const onSendSMS = async (params) =>
    UserApi.sendSms({
      project: 'MARKETING',
      signName: '慕思内部',
      tempCode: '3639eb52f81d4961841056ece979fe84',
      operType: 'CAPTCHA',
      tempParam: '{}',
      sender: 8824050807419,
      mhzTime: 1,
      validTime: 5,
      ...params,
    })

  // 获取图形验证码
  const getGraphicImage = (value = null) => {
    const phone = value ?? '123'
    graphicImage.value = `${
      import.meta.env.VITE_APP_CLOUD_BASE_URL
    }/commonservice/identifyimage/get?onlyCode=${phone}&${new Date().valueOf()}`
  }
  getGraphicImage()

  return { onSendSMS, getGraphicImage, graphicImage }
}
