import dotenv from 'dotenv'
import extend from 'extend'
import { watch, type FSWatcher } from 'chokidar'
import { getNodeEnv, getMpEnv, processResolve } from '@weejs/plugin-utils'
import { shallowMerge } from '@txjs/shared'
import { isValidString, isPlainObject } from '@txjs/bool'

type WatchListener = (...args: any[]) => void

interface Env {
	[x: string]: string
}

type FilterCallback = (
	key: string,
	value: string,
	index: number
) => boolean | Env | undefined

interface PlatformEnvOption {
	watchListener?: WatchListener
}

const nodeEnv = getNodeEnv()
const mpEnv = getMpEnv()

export class PlatformEnv {
	#PREFIX = 'w'
	#config = {} as PlatformEnvOption
	#env = {} as Env
	#updated = false
	#loaded = false

	#fsWatcher: FSWatcher | null = null

	constructor(option?: PlatformEnvOption) {
		extend(true, this.#config, option)
	}

	#pathSplicing(...dir: (string | undefined)[]) {
		return processResolve(['.env', ...dir].join('.'))
	}

	get watcher() {
		return this.#fsWatcher
	}

	watch() {
		if (!this.#fsWatcher) {
			this.#fsWatcher = watch([
				'.env',
				'.env.local',
				`.env.${nodeEnv}`,
				`.env.${mpEnv}`,
				`.env.${nodeEnv}.local`,
				`.env.${mpEnv}.local`
			], {
				ignored: 'node_modules',
				persistent: true,
				ignoreInitial: true,
				cwd: '.'
			}).on('all', (args) => {
				this.updated()
				this.#config.watchListener?.(args)
			})
		}
	}

	updated() {
		if (this.#loaded) {
			this.#updated = true
		}
	}

	loadEnv() {
		if (!this.#loaded || this.#updated) {
			const envConfig = {
				WEEJS_PREFIX: this.#PREFIX
			} as Env

			// 全局环境配置
			const globalConfig = dotenv.config({
				path: this.#pathSplicing()
			})
			const localGlobalConfig = dotenv.config({
				path: this.#pathSplicing('local')
			})

			// NODE环境配置
			const nodeEnvConfig = dotenv.config({
				path: this.#pathSplicing(nodeEnv)
			})
			const localNodeEnvConfig = dotenv.config({
				path: this.#pathSplicing(nodeEnv, 'local')
			})

			// TARO环境配置
			const taroEnvConfig = dotenv.config({
				path: this.#pathSplicing(mpEnv)
			})
			const localTaroEnvConfig = dotenv.config({
				path: this.#pathSplicing(mpEnv, 'local')
			})

			// 合并全部环境配置
			// 本地配置权重最高
			extend(true, envConfig,
				// 全局环境
				!globalConfig.error && globalConfig.parsed,
				// 自定义环境
				!nodeEnvConfig.error && nodeEnvConfig.parsed,
				// 小程序环境
				!taroEnvConfig.error && taroEnvConfig.parsed,
				// 本地全局环境
				!localGlobalConfig.error && localGlobalConfig.parsed,
				// 本地自定义环境
				!localNodeEnvConfig.error && localNodeEnvConfig.parsed,
				// 本地小程序环境
				!localTaroEnvConfig.error && localTaroEnvConfig.parsed,
			)

			this.#env = Object
				.keys(envConfig)
				.reduce(
					(obj, key) => {
						if (key.startsWith('WEEJS')) {
							const value = this.parse(Reflect.get(envConfig, key), envConfig)
							Reflect.set(envConfig, key, JSON.parse(value))
							Reflect.set(obj, key, value)
						}
						return obj
					}, {} as Env
				)
			this.#loaded = true
			this.#updated = false
		}

		return this.#env
	}

	/** 解析环境value值 */
	parse(input: string, obj: Env) {
		if (input.startsWith('@')) {
			const strArr = input.split('@')
			input = strArr
				.reduce(
					(chunks, str) => {
						if (Reflect.has(obj, str)) {
							chunks.push(Reflect.get(obj, str))
						}
						return chunks
					}, [] as string[]
				)
				.join('')
		}
		return JSON.stringify(input)
	}

	filter(obj: Env, callback: FilterCallback) {
		const newObj = {} as Env
		const keys = Object.keys(obj)
		let i = 0

		while (keys.length) {
			const key = keys.shift()!
			const value = Reflect.get(obj, key)
			const result = callback(key, value, i)

			if (result === true) {
				Reflect.set(newObj, key, value)
			} else if (isPlainObject(result)) {
				shallowMerge(newObj, result)
			}

			i++
		}
		return newObj
	}

	generateName(name?: string) {
		return isValidString(name) ? `process.env.${name}` : ''
	}

	cleanName(name?: string) {
		return isValidString(name) ? name.replace(/^process\.env\./, '') : ''
	}

	cleanValue(value?: string) {
		return isValidString(value) ? JSON.parse(value) : ''
	}

	isTruly(value?: string) {
		return isValidString(value) ? /^true$/i.test(value) : false
	}
}
