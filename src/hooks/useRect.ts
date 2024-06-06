import { getCurrentInstance } from 'vue'

export default function useRect(selector: string) {
  return new Promise((resolve) => {
    const instance = getCurrentInstance()
    const query = uni.createSelectorQuery().in(instance)
    query
      .select(selector)
      .boundingClientRect((data) => {
        resolve(data)
      })
      .exec()
  })
}
