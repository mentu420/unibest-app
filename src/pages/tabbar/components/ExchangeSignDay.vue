<script setup>
import dayjs from 'dayjs'
import { ref, computed, onMounted } from 'vue'

import { isAlreadySigned } from '@/hooks/useExchangeSign'
import { useMaterialStore, useUserStore } from '@/store'
import { navigator } from '@/utils/navigator'
import { getStorage, setStorage } from '@/utils/storage'

const { getStaticResourceUrl } = useMaterialStore()

const emits = defineEmits(['change'])

const popupRef = ref(null)

const close = () => popupRef.value.close()

const onClick = () => {
  close()
  navigator({ url: '/pages/tabbar/personalPage' })
}

const onChange = (e) => {
  emits('change', e)
  if (e.show) return
  setStorage('closeExchangeSign', dayjs().format('YYYY-MM-DD'))
}

const init = async () => {
  const { useGetToken } = useUserStore()
  const closeExchangeSign = getStorage('closeExchangeSign')
  if (!useGetToken() || (closeExchangeSign && closeExchangeSign === dayjs().format('YYYY-MM-DD')))
    return
  const bool = await isAlreadySigned({ behaviorId: 10101 })
  if (bool) return
  popupRef.value.open('center')
}

onMounted(init)
</script>

<template>
  <uni-popup ref="popupRef" @change="onChange">
    <view class="flex h-screen w-screen items-center justify-center p-4" @click="close">
      <view class="h-[68vw] w-[51vw]" @click="onClick">
        <m-image
          mode="aspectFit"
          class="h-[68vw] w-[51vw]"
          :src="getStaticResourceUrl('work/sign-in')"
        />
      </view>
    </view>
  </uni-popup>
</template>
