// uno.config.ts
import {
  type Preset,
  defineConfig,
  presetUno,
  presetAttributify,
  presetIcons,
  presetWind,
  transformerDirectives,
  transformerVariantGroup,
} from 'unocss'

import {
  presetApplet,
  presetRemRpx,
  transformerAttributify,
  transformerApplet,
} from 'unocss-applet'

// @see https://unocss.dev/presets/legacy-compat
import { presetLegacyCompat } from '@unocss/preset-legacy-compat'

const isMp = process.env?.UNI_PLATFORM?.startsWith('mp') ?? false

const presets: Preset[] = []
if (isMp) {
  // 使用小程序预设
  presets.push(presetApplet(), presetRemRpx())
} else {
  presets.push(
    // 非小程序用官方预设
    presetUno(),
    // 支持css class属性化
    presetAttributify(),
    // wind css 预设
    presetWind(),
  )
}
export default defineConfig({
  theme: {
    colors: {
      primary: '#007aff',
      'page-gray': '#f7f7f7',
    },
  },
  presets: [
    ...presets,
    // 支持图标，需要搭配图标库，eg: @iconify-json/carbon, 使用 `<button class="i-uil-image-times dark:i-carbon-moon" />`
    presetIcons({
      scale: 1.2,
      warn: true,
      extraProperties: {
        display: 'inline-block',
        'vertical-align': 'middle',
      },
    }),
    // 将颜色函数 (rgb()和hsl()) 从空格分隔转换为逗号分隔，更好的兼容性app端，example：
    // `rgb(255 0 0)` -> `rgb(255, 0, 0)`
    // `rgba(255 0 0 / 0.5)` -> `rgba(255, 0, 0, 0.5)`
    presetLegacyCompat({
      commaStyleColorFunction: true,
    }) as Preset,
  ],
  /**
   * 自定义快捷语句
   * @see https://github.com/unocss/unocss#shortcuts
   */
  shortcuts: {
    center: 'flex justify-center items-center',
    'btn-base': 'm-0 rounded-full p-3 text-center text-base before:content-none after:content-none',
    'btn-primary': 'btn-base border-primary bg-primary  text-white font-bold',
  },
  transformers: [
    // 启用 @apply 功能
    transformerDirectives(),
    // 启用 () 分组功能
    // 支持css class组合，eg: `<div class="hover:(bg-gray-400 font-medium) font-(light mono)">测试 unocss</div>`
    transformerVariantGroup(),
    // Don't change the following order
    transformerAttributify({
      // 解决与第三方框架样式冲突问题
      prefixedOnly: true,
      prefix: 'fg',
    }),
    transformerApplet(),
  ],
  rules: [
    [
      /**
       * 安全区域
       * @example
       * safe-mb-1 => margin-bottom: 8rpx; margin-bottom: calc(env(safe-area-inset-bottom) + 8rpx);
       * safe-mb-10px => margin-bottom: 20rpx; margin-bottom: calc(env(safe-area-inset-bottom) + 20rpx);
       */
      /^safe-(mt|mb|ml|mr|pt|pb|pl|pr)-(-?.+)$/,
      (match) => {
        const [cls, type, v] = match
        const positions = {
          t: 'top',
          b: 'bottom',
          l: 'left',
          r: 'right',
        }
        const props = {
          m: 'margin',
          p: 'padding',
        }
        const [x, y] = type.split('')
        const position = positions[y]
        const prop = props[x]
        const cssProp = `${prop}-${position}`
        const num = Number(v)
        const isNum = !Number.isNaN(num)
        const cssValue = isNum ? `${num * 4}px` : v
        return `
          .${cls}{
            ${cssProp}:${cssValue};
            ${cssProp}:calc(constant(safe-area-inset-${position}) + ${cssValue});
            ${cssProp}:calc(env(safe-area-inset-${position}) + ${cssValue});
          }
        `
      },
    ],
  ],
})

/**
 * 最终这一套组合下来会得到：
 * mp 里面：mt-4 => margin-top: 32rpx  == 16px
 * h5 里面：mt-4 => margin-top: 1rem == 16px
 *
 * 另外，我们还可以推算出 UnoCSS 单位与设计稿差别4倍。
 * 375 * 4 = 1500，把设计稿设置为1500，那么设计稿里多少px，unocss就写多少述职。
 * 举个例子，设计稿显示某元素宽度100px，就写w-100即可。
 *
 * 如果是传统方式写样式，则推荐设计稿设置为 750，这样设计稿1px，代码写1rpx。
 * rpx是响应式的，可以让不同设备的屏幕显示效果保持一致。
 */
