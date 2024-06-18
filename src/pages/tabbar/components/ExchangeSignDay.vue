<script setup lang="ts">
import dayjs from 'dayjs'
import { ref, watch, onMounted } from 'vue'

import { isAlreadySigned } from '@/hooks/useExchangeSign'
import { useMaterialStore, useUserStore } from '@/store'
import { navigator } from '@/utils/navigator'
import { getStorage, setStorage } from '@/utils/storage'
import { StorageEnum } from '@/enums/storage'

const { getStaticResourceUrl } = useMaterialStore()

const emits = defineEmits(['change'])

const show = ref<boolean>(false)

const close = () => (show.value = false)

const onClick = () => {
  close()
  navigator({ url: '/pages/tabbar/personalPage' })
}

watch(
  () => show.value,
  (val) => {
    emits('change', val)
    if (val) return
    setStorage(StorageEnum.CLOST_EXCHANGE_SIGN, dayjs().format('YYYY-MM-DD'))
  },
)

const init = async () => {
  const { useGetToken } = useUserStore()
  const closeExchangeSign = getStorage(StorageEnum.CLOST_EXCHANGE_SIGN)
  if (!useGetToken() || (closeExchangeSign && closeExchangeSign === dayjs().format('YYYY-MM-DD')))
    return
  const bool = await isAlreadySigned({ behaviorId: 10101 })
  if (bool) return
  show.value = true
}

onMounted(init)
</script>

<template>
  <wd-popup v-model="show">
    <view class="flex h-screen w-screen items-center justify-center p-4" @click="close">
      <view class="h-[68vw] w-[51vw]" @click="onClick">
        <m-image
          mode="aspectFit"
          class="h-[68vw] w-[51vw]"
          :src="getStaticResourceUrl('work/sign-in')"
        />
      </view>
    </view>
  </wd-popup>
</template>
