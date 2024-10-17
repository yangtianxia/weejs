import shell from 'shelljs'
import extend from 'extend'
import definePlugin from '@weejs/plugin-define'
import { cosmiconfigSync } from 'cosmiconfig'
import { isNil, isFunction, isArray } from '@txjs/bool'
import { toArray } from '@txjs/shared'
import { processResolve, toJSON } from '@weejs/plugin-utils'
import { fieldMap, fileNameMap } from './utils'
import type { ConditionOption } from './interface'

export * from './interface'

export default definePlugin((ctx) => {
	const fileName = Reflect.get(fileNameMap, ctx.mpEnv)
	const fields = Reflect.get(fieldMap, ctx.mpEnv)
	const fieldKeys = Object.keys(fields)

	const transformFields = (option: Record<string, any>) => {
		return fieldKeys.reduce(
			(obj, key) => {
				obj[fields[key]] = option[key]
				return obj
			}, {} as Record<string, any>
		)
	}

	const transformEnv = (env: string) => {
		switch (env) {
			case 'dev':
				return 'development'
			case 'prod':
				return 'production'
			default:
				return env
		}
	}

	const generate = (config: ConditionOption[]) => {
		const compiles = config.filter((item) => {
			const allEnv = isNil(item.env)
			const allMp = isNil(item.mp)

			if (allEnv && allMp) {
				return true
			}

			const env = toArray(allEnv ? '*' : item.env!).map(transformEnv)
			const mp = toArray(allMp ? '*' : item.mp!)

			return (
				env.includes('*') ||
				env.includes(ctx.nodeEnv)
			) && (
				mp.includes('*') ||
				mp.includes(ctx.mpEnv)
			)
		})
		.map(transformFields)

		switch (ctx.mpEnv) {
			case 'alipay':
				return { modes: compiles }
			case 'tt':
			case 'qq':
			case 'weapp':
			case 'lark':
				return {
					condition: {
            miniprogram: { list: compiles }
          }
				}
		}
	}

	const preprocessPath = (path: string) => {
		const foundAt = path.lastIndexOf('/')

		if (foundAt > 0) {
			const foundFolder = path.slice(0, foundAt + 1)
      const folderPath = processResolve(ctx.paths.outputPath, foundFolder)
      if (!shell.test('-d', folderPath)) {
        shell.mkdir('-p', folderPath)
      }
      path = path.slice(0, foundAt)
		}
		return path
	}

	const build = () => {
		if (!shell.test('-e', processResolve('weejs/conditionrc.ts'))) {
			return
		}

		const explorer = cosmiconfigSync('condition', {
			cache: false
		})
		// 加载配置
		const result = explorer.load('weejs/conditionrc.ts')

		// 配置为空
		if (!result) {
			return
		}

		try {
			let sourceConfig = [] as any

			if (isFunction(result.config)) {
				sourceConfig = result.config()
			} else if (isArray(result.config)) {
				sourceConfig = result.config
			}

			// 处理启动配置
			const compiles = generate(sourceConfig)

			// 预处理路径
			preprocessPath(fileName)

			// 最终配置
			let config = {} as Record<string, any>

			// 忽略不支持私有化配置的平台
			if (!['weapp', 'qq', 'tt', 'alipay'].includes(ctx.mpEnv) && shell.test('-e', fileName)) {
				const temp = shell.cat(fileName)
				const tempConfig = toJSON(temp)
				config = extend(true, config, tempConfig)
			}

			const finalConfig = extend(true, config, compiles)

			shell.ShellString(
				JSON.stringify(finalConfig)
			).to(
				processResolve(ctx.paths.outputPath, fileName)
			)

			ctx.log('✨', 'Build finish.')
		} catch (err) {
			ctx.log('❌', 'Build error.')
			ctx.log(err)
		}
	}

	ctx.onBuildFinish(build)
}, {
	name: 'weejs-plugin-condition',
	ignore: ['h5']
})
