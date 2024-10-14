import shell from 'shelljs'
import definePlugin from '@weejs/plugin-define'
import { processResolve } from '@weejs/plugin-utils'
import { isPlainObject } from '@txjs/bool'
import type { DefineDeclare } from './utils'

import envDeclare from './env'
import vantIconDeclare from './vant-icon'

export * from './utils'

export { vantIconDeclare }

interface TypesPluginOption {
	/** 跟随打包目录之下的目录 */
	outputDir?: string
	/** 自定义声明 */
	declare?: DefineDeclare[]
}

export default definePlugin<TypesPluginOption>((ctx, option) => {
	const outputPath = processResolve(ctx.outputWeejs, option.outputDir || 'types')

	// 目录已存在，则删除
	if (shell.test('-e', outputPath)) {
		shell.rm('-r', outputPath)
	}

	// 重新创建目录
	// 确保每次都是新的
	shell.mkdir('-p', outputPath)

	const declare = [envDeclare, ...(option.declare || [])]

	const build = () => {
		declare
			.map((generate) => generate())
			.filter(isPlainObject)
			.forEach((config) => {
				shell.ShellString(
					config.sourceString
				).to(
					processResolve(outputPath, config.fileName)
				)
			})

		ctx.log('✨', 'Build finish.')
	}

	ctx.onBuildFinish(() => build())
}, {
	name: 'weejs-plugin-types'
})
