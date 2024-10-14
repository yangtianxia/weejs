import type { MpEnv } from '@weejs/plugin-utils'

interface PresetColorPalettesBase {
	/** 主色调 */
	primary: string
	/** 块背景 */
	blockLightBackground?: string
	/** 块暗黑背景 */
	blockDarkBackground?: string
	/** 灰色 */
	grey?: string[]
	/** light */
	light?: Record<string, string>
	/** dark */
	dark?: Record<string, string>
}

export type PresetColorPalettes =
	PresetColorPalettesBase
	& Partial<Record<MpEnv, Partial<PresetColorPalettesBase>>>

export const defineWeeJSTheme = (callback: () => PresetColorPalettes) => {
	return callback
}
