import path from 'path'
import minimist from 'minimist'
import { isValidString } from '@txjs/bool'

export type NodeEnv =
	| 'development'
	| 'production'
	| (string & Record<never, never>)

export type MpEnv =
	| 'weapp'
	| 'alipay'
	| 'tt'
	| 'qq'
	| 'lark'
	| 'swan'
	| 'h5'

const ciArgs = minimist(process.argv.slice(2), {
	string: ['type', 'mode']
})

/** Node环境 */
export const getNodeEnv = () => {
	return (
		isValidString(ciArgs.mode)
			? ciArgs.mode :
			process.env.NODE_ENV
	) as NodeEnv
}

/** Mp类型 */
export const getMpEnv = () => {
	return (
		isValidString(ciArgs.type)
			? ciArgs.type
			: process.env.TARO_ENV
	) as MpEnv
}

export const resolve = (...dir: string[]) => {
	return path.resolve(...dir)
}

export const processResolve = (...dir: string[]) => {
	return resolve(process.cwd(), ...dir)
}

export const toJSON = (input?: string) => {
	if (!input) {
		return {}
	}

	try {
		return JSON.parse(input)
	} catch {
		return {}
	}
}
