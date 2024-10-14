import tinycolor2 from 'tinycolor2'
import { defineConfig } from 'pollen-css/utils'
import { shallowMerge, pick, omit } from '@txjs/shared'
import { platformEnv } from '@weejs/plugin-environment'
import { outputWeejs } from '@weejs/plugin-define'
import { getMpEnv } from '@weejs/plugin-utils'
import { getColorPalettes } from './dist/index.esm.mjs'

const mpEnv = getMpEnv()

const unitPattern = /([(-?\d)(\.\d)|\d])+(px)/ig

const toRatio = (input) => {
  const size = parseFloat(input)
  return size === 1 ? size : size * 2
}

const pxToRpx = (input) => {
  const foundAt = input.match(unitPattern)
  if (foundAt) {
    return foundAt.reduce(
      (str, numeric) => str.replace(numeric, `${toRatio(numeric)}rpx`), input, 
    )
  }
  return input
}

const pxTransform = (obj) => {
  const shallowCopy = shallowMerge({}, obj)
  if (mpEnv !== 'h5') {
    for (const key in obj) {
      const value = Reflect.get(obj, key)
      Reflect.set(shallowCopy, key, pxToRpx(value))
    }
  }
  return shallowCopy
}

const getAlphaColor = (input) => {
  const color = tinycolor2(input)
  if (color.isValid()) {
    return Object
      .values(color.toRgb())
      .slice(0, 3)
      .toString()
  }
  return input
}

const formatterColor = (palettes = {}) => {
  return Object
    .keys(palettes)
    .reduce(
      (obj, key) => {
        const value = Reflect.get(palettes, key)
        const color = getAlphaColor(value)
        const baseName = `${key}-base`
        Reflect.set(obj, baseName, color)
        Reflect.set(obj, key, `rgb(--color-${baseName})`)
        return obj
      }, {}
    )
}

export default defineConfig(async (defaultConfig) => {
  const colorPalettes = await getColorPalettes()
  const modules = pick(defaultConfig, [
    'size',
    'radius',
    'line',
    'layer',
    'weight',
    'shadow'
  ])

  modules.visibility = {
    none: 0,
    1: 0.2,
    2: 0.4,
    3: 0.6,
    4: 0.8,
    5: 1
  }

  modules.duration = {
    fast: '0.2s',
    slow: '0.3s',
    turtle: '0.5s'
  }

  modules.size = pxTransform({
    ...modules.size,
    none: '0px',
    xs: '10px',
    sm: '12px',
    md: '14px',
    lg: '16px',
    xl: '18px'
  })

  modules.radius = pxTransform(modules.radius)

  modules.color = {
    ...formatterColor(colorPalettes.light),
    ...formatterColor(omit(colorPalettes, ['light', 'dark'])),
    bgcolor: 'var(--color-grey-1)',
    active: 'var(--color-grey-2)',
    border: 'var(--color-grey-2)',
    text: 'var(--color-grey-10)',
    'text-base': 'var(--color-grey-9)',
    'text-light': 'var(--color-grey-8)',
    'text-weak': 'var(--color-grey-6)',
  }

  for (const key in defaultConfig) {
    if (!Reflect.has(modules, key)) {
      Reflect.set(modules, key, false)
    }
  }

  const media = {}

  if (platformEnv.isTruly(process.env.WEEJS_DARKMODE)) {
    Reflect.set(media, `(prefers-color-scheme: dark)`, {
      color: {
        ...formatterColor(colorPalettes.dark),
        active: 'var(--color-grey-3)',
        border: 'var(--color-grey-3)',
      }
    })
  }

  return {
    media,
    modules,
    selector: 'page',
    output: `${outputWeejs}/style/theme.css`
  }
})