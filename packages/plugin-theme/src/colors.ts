import shell from 'shelljs'
import extend from 'extend'
import { cosmiconfigSync } from 'cosmiconfig'
import { generate, presetPalettes } from '@ant-design/colors'
import { processResolve, getMpEnv, type MpEnv } from '@weejs/plugin-utils'
import { omit } from '@txjs/shared'
import { isFunction, isPlainObject } from '@txjs/bool'
import type { PresetColorPalettes } from './interface'

const defaultColors = {
	black: '#000000',
  white: '#FFFFFF'
}

const defaultGreyColors = [
	'#F8F8F8',
	'#EFEFEF',
	'#DFDFDF',
	'#C6C6C6',
	'#ADADAD',
	'#949494',
	'#7B7B7B',
	'#626262',
	'#494949',
	'#303030',
	'#171717',
	'#0D0D0D'
]

const generateSerial = (color: string, items: string[]) => {
	return items
		.reduce(
			(obj, value, index) => {
				if (index === 5) {
					obj[color] = value
				}
				obj[`${color}-${index + 1}`] = value
				return obj
			}, {} as Record<string, string>
		)
}

const generatePalettesSerial = (palettes: Record<string, string[]>) => {
	return Object
		.keys(palettes)
		.reduce(
			(obj, key) => {
				const items = palettes[key]
				extend(obj, generateSerial(key, items))
				return obj
			}, {} as Record<string, any>
		)
}

const parse = (config: Partial<Omit<PresetColorPalettes, MpEnv>> = {}) => {
	const { blockLightBackground, blockDarkBackground } = config
	const light = Reflect.get(config, 'light') || {}
	const dark = Reflect.get(config, 'dark') || {}

	// 块背景颜色
	if (blockLightBackground) {
		Reflect.set(light, 'blockBackground', blockLightBackground)
	}

	if (blockDarkBackground) {
		Reflect.set(dark, 'blockBackground', blockDarkBackground)
	}

	// 主色调
	if (config.primary) {
		const primaryColors = generate(config.primary)
		const presetPrimary = generateSerial('primary', primaryColors)
		extend(true, light, presetPrimary)
		extend(true, dark, presetPrimary)
	}

	// 中性色
	if (config.grey) {
		extend(true, light, generateSerial('grey', config.grey))
		extend(true, dark, generateSerial('grey', config.grey.reverse()))
	}

	return { light, dark }
}

export const getColorPalettes = () => {
	const config = {
		blockLightBackground: '#FFFFFF',
		blockDarkBackground: '#171717',
		grey: defaultGreyColors
	} as PresetColorPalettes

	// 加载配置
	if (shell.test('-e', processResolve('weejs/themerc.ts'))) {
		const explorer = cosmiconfigSync('theme', {
			cache: false
		})
		const result = explorer.load('weejs/themerc.ts')
		if (result) {
			if (isFunction(result.config)) {
				extend(true, config, result.config())
			} else if (isPlainObject(result.config)) {
				extend(true, config, result.config)
			}
		}
	}

	const mpEnv = getMpEnv()

	// 导航栏标题、状态栏颜色
	// https://developers.weixin.qq.com/miniprogram/dev/reference/configuration/page.html
	const navigationBarColor = 'black'
	const navigationBarDarkColor = 'white'

	// 预设颜色
	const presetColors = generatePalettesSerial(omit(presetPalettes, ['grey']))

	// 基础颜色配置
	const baseColors = parse(config)

	// 小程序或h5颜色配置
	const mpConfig = Reflect.get(config, mpEnv)

	// 配置了主色调，但没有设置块元素暗黑色
	if (mpConfig?.primary && !mpConfig.blockDarkBackground) {
		mpConfig.blockDarkBackground = config.blockDarkBackground
	}

	const mpColors = parse(mpConfig)

	return extend(true, {
			light: {
				navigationBar: navigationBarColor
			},
			dark: {
				navigationBar: navigationBarDarkColor
			}
		},
		defaultColors,
		presetColors,
		baseColors,
		mpColors
	)
}

export type ColorPalettes = Awaited<ReturnType<typeof getColorPalettes>>
