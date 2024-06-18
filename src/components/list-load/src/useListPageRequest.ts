import { onPullDownRefresh, onReachBottom } from '@dcloudio/uni-app'
import { computed, onMounted, ref } from 'vue'
import type { PaginationRequest, HttpPaginated } from './types.d'

function useListPageRequest<T = any>(
  request: (params: PaginationRequest) => Promise<HttpPaginated<T>>,
  options: {
    autoBind?: boolean
    autoRequest?: boolean
    isOldStyle?: boolean
  } = {},
) {
  const { autoBind = true, autoRequest = true, isOldStyle = false } = options
  const list = ref<T[]>([])
  // 加载中
  const loading = ref(false)
  // 加载更多中
  const moreLoading = ref(false)
  // 全部数据加载完成
  const totalPage = ref(0)
  const finished = computed(() => totalPage.value <= pagingParams.value.currPage!)
  const pagingParams = ref<PaginationRequest>({
    currPage: 1,
    pageSize: 10,
  })
  const getPagingParams = computed(() => {
    if (isOldStyle) {
      return {
        page: pagingParams.value.currPage,
        limit: pagingParams.value.pageSize,
      }
    }
    return {
      ...pagingParams.value,
    }
  })
  let customParams: PaginationRequest = {}

  const statusLoading = computed(() => {
    if (moreLoading.value || loading.value) {
      return 'loading'
    }
    if (finished.value) {
      return 'noMore'
    }
    return 'more'
  })

  const loadData = async () => {
    const requestData = await request({
      ...getPagingParams.value,
      ...customParams,
    })

    if (
      (isOldStyle ? requestData.data.currPage === 1 : requestData.currPage === 1) ||
      pagingParams.value.currPage === 1
    ) {
      list.value = [] as any[]
    }
    if (isOldStyle) {
      totalPage.value = requestData.data.totalPage
      if (Array.isArray(requestData.data.list)) {
        list.value.push(...requestData.data.list)
      }
    } else {
      totalPage.value = requestData.totalPage
      list.value.push(...(requestData.data ?? []))
    }
  }

  const onReload = async (params?: AnyObject) => {
    loading.value = true
    pagingParams.value.currPage = 1
    if (params) {
      customParams = params
    }
    try {
      await loadData()
    } finally {
      loading.value = false
    }
  }
  const onMore = async () => {
    if (finished.value) {
      return
    }
    pagingParams.value.currPage = pagingParams.value.currPage! + 1
    moreLoading.value = true
    try {
      await loadData()
    } finally {
      moreLoading.value = false
    }
  }

  if (autoRequest) {
    onMounted(onReload)
  }
  if (autoBind) {
    onPullDownRefresh(async () => {
      await onReload()
      uni.stopPullDownRefresh()
    })
    onReachBottom(onMore)
  }

  return {
    list,
    loading,
    moreLoading,
    finished,
    statusLoading,
    totalPage,

    onReload,
    onMore,
  }
}

export { useListPageRequest }
