import shell from 'shelljs'
import { toArray } from '@txjs/shared'
import type { IPluginContext } from '@tarojs/service'

import {
	getNodeEnv,
	getMpEnv,
	processResolve,
	type MpEnv,
	type NodeEnv
} from '@weejs/plugin-utils'

export interface CustomPluginContext extends IPluginContext {
	/** 平台环境 */
	mpEnv: MpEnv
	/** node环境 */
	nodeEnv: NodeEnv
	/** weejs私有产物目录 */
	outputWeejs: string
	/** 日志输出 */
	log(...args: any[]): void
}

interface FieldRule {
	test: RegExp
	message: string
}

interface DefinePluginOption {
	name?: string
	ignore?: MpEnv[]
	rules?: Record<string, FieldRule | FieldRule[]>
}

type DefinePluginCallback<T> = (
	ctx: CustomPluginContext,
	option: T
) => void

let id = 0

const outputWeejs = processResolve('node_modules', '.weejs')

export { outputWeejs }

export default function definePlugin<T extends Record<string, any>>(
	callback: DefinePluginCallback<T>,
	config?: DefinePluginOption
): DefinePluginCallback<T> {
	const nodeEnv = getNodeEnv()
	const mpEnv = getMpEnv()

	// 自增ID
	id += 1

	const {
		name = `unknown-plugin-${id}`,
		ignore = [],
		rules = {}
	} = config || {}

	// MP没有指定任何运行方式时
	// 返回一个noop
	if (mpEnv == null || nodeEnv == null || ignore.includes(mpEnv)) {
		return () => {}
	}

	const log = (...args: any[]) => {
		console.log(`[${name}] `, ...args)
	}

	const validator = <T extends Record<string, any>>(
		rules: Record<string, FieldRule | FieldRule[]>,
		values: T
	) => {
		if (values) {
			const keys = Object.keys(values)
			for (const key of keys) {
				if (Reflect.has(rules, key)) {
					const value = values[key]
					const rule = toArray(rules[key])
					const err = rule.find((item) => !item.test.test(value))
					if (err) {
						throw new Error(`[${name}] ${key}：${err.message}`)
					}
				}
			}
		}
	}

	return (ctx, option) => {
		// 验证参数
		validator(rules, option)

		// 创建缓存目录
		if (!shell.test('-e', outputWeejs)) {
			shell.mkdir('-p', outputWeejs)
		}

		ctx.nodeEnv = nodeEnv
		ctx.mpEnv = mpEnv
		ctx.outputWeejs = outputWeejs
		ctx.log = log
		callback.apply(null, [ctx, option || {}])
	}
}
