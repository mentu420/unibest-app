import { computed, ref } from 'vue'
import { useMaterialStore } from '@/store'

const { getStaticResourceUrl } = useMaterialStore()

const defineShare = computed(() => ({
  title: '高效门店管理，精准运营数据',
  path: '/pages/tabbar/workPage',
  imageUrl: getStaticResourceUrl(`work/logo`),
}))

export default defineShare
