import type { MpEnv, NodeEnv } from '@weejs/plugin-utils'

export type SupportMp = Exclude<MpEnv, 'h5' | 'swan'>

export type SupportEnv = 'dev' | 'prod' | NodeEnv

export interface ConditionOption {
	title: string
	page: string
	launchMode?: string
	query?: string | Record<string, any>
	scene?: string | Record<string, any>
	/** 支持编辑启动的平台 */
	mp?: SupportMp | SupportMp[]
	/** 支持编译启动的环境 */
	env?: SupportEnv | SupportEnv[]
}

export const defineWeeJSCondition = (callback: () => ConditionOption[]) => {
	return callback
}
