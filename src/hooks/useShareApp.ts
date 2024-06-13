import { computed, ref } from 'vue'
import { useMaterialStore } from '@/store'
import { tabbarPath } from '@/enums/navigator'

const { getStaticResourceUrl } = useMaterialStore()

const defineShare = computed(() => ({
  title: '高效门店管理，精准运营数据',
  path: tabbarPath.WORK_PATH,
  imageUrl: getStaticResourceUrl(`work/logo`),
}))

export default defineShare
