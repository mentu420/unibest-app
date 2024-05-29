import type { App, Component } from 'vue'

const camelizeRE = /-(\w)/g

export type Numeric = number | string

export type Writeable<T> = { -readonly [P in keyof T]: T[P] }

export const camelize = (str: string): string => str.replace(camelizeRE, (_, c) => c.toUpperCase())

export const isDef = <T>(val: T): val is NonNullable<T> => val !== undefined && val !== null

// eslint-disable-next-line @typescript-eslint/ban-types
export const isFunction = (val: unknown): val is Function => typeof val === 'function'

export const isNumeric = (val: Numeric): val is string =>
  typeof val === 'number' || /^\d+(\.\d+)?$/.test(val)

export function pick<T, U extends keyof T>(
  obj: T,
  keys: ReadonlyArray<U>,
  ignoreUndefined?: boolean,
) {
  return keys.reduce(
    (ret, key) => {
      if (!ignoreUndefined || obj[key] !== undefined) {
        ret[key] = obj[key]
      }
      return ret
    },
    {} as Writeable<Pick<T, U>>,
  )
}

export function addUnit(value?: Numeric): string | undefined {
  if (isDef(value)) {
    return isNumeric(value) ? `${value}px` : String(value)
  }
  return undefined
}

export function closest(arr: number[], target: number) {
  return arr.reduce((pre, cur) => (Math.abs(pre - target) < Math.abs(cur - target) ? pre : cur))
}

export const makeNumberProp = <T>(defaultVal: T) => ({
  type: Number,
  default: defaultVal,
})

export const makeStringProp = <T>(defaultVal: T) => ({
  type: String as unknown as PropType<T>,
  default: defaultVal,
})

type EventShim = {
  new (...args: any[]): {
    $props: {
      onClick?: (...args: any[]) => void
    }
  }
}

export type WithInstall<T> = T & {
  install(app: App): void
} & EventShim

export function withInstall<T extends Component>(options: T) {
  ;(options as Record<string, unknown>).install = (app: App) => {
    const { name } = options
    if (name) {
      app.component(name, options)
      app.component(camelize(`-${name}`), options)
    }
  }

  return options as WithInstall<T>
}
