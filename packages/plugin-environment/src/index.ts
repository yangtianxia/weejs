import extend from 'extend'
import definePlugin from '@weejs/plugin-define'
import { shallowMerge } from '@txjs/shared'
import { isValidString } from '@txjs/bool'
import { PlatformEnv } from './platform-env'

interface EnvironmentPluginOption {
	/** 观察模式 */
	watch?: boolean
}

export const platformEnv = new PlatformEnv()

export default definePlugin<EnvironmentPluginOption>((ctx, option) => {
	ctx.onBuildStart(() => {
		if (option.watch) {
			platformEnv.watch()
		}
	})

	ctx.modifyWebpackChain(({ chain }) => {
		const env = platformEnv.loadEnv()
		// 默认前缀
		const prefixValue = Reflect.get(env, 'WEEJS_PREFIX')

		// 在less声明@wee全局变量
		if (isValidString(prefixValue)) {
			const lessVars = {
				'@wee': platformEnv.cleanValue(prefixValue)
			} as Record<string, string>

			chain.module
				.rule('less')
				.oneOf('2')
				.use('3')
				.tap((option: any) => {
					option ??= {}
					option.lessOptions ??= {}
					option.lessOptions.modifyVars = extend(true, option.lessOptions?.modifyVars, lessVars)
					return option
				})
				.end()
		}

		const constants = {} as Record<string, any>

		for (const key in env) {
			const value = Reflect.get(env, key)
			Reflect.set(constants, platformEnv.generateName(key), value)
		}

		chain
			.plugin('definePlugin')
			.tap((args: any[]) => {
				shallowMerge(args[0], constants)
				return args
			})
			.end()

		ctx.log('✨', 'Injection finish.')
	})
}, {
	name: 'weejs-plugin-environment',
})

export { PlatformEnv }
