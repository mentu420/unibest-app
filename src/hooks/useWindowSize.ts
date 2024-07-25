export default function useWindowSize() {
  const windowWidth = ref(0)
  const windowHeight = ref(0)
  const systemInfo = ref({})

  uni.getSystemInfo({
    success: async (data) => {
      systemInfo.value = data
      windowWidth.value = data.windowWidth
      windowHeight.value = data.windowHeight
    },
  })

  return { windowWidth, windowHeight }
}
