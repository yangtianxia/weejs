import fs from 'fs-extra'
import shell from 'shelljs'
import extend from 'extend'
import definePlugin from '@weejs/plugin-define'
import { platformEnv } from '@weejs/plugin-environment'
import { processResolve, toJSON, type MpEnv } from '@weejs/plugin-utils'
import { globalFieldMap, fileNameMap } from './utils'

import AlipayCli, { alipayModifyConfig } from './mp/alipay'
import LarkCli from './mp/lark'
import SwanCli from './mp/swan'
import TtCli from './mp/tt'

type SupportMp = Exclude<MpEnv, 'h5'>

type MpConfig = Record<SupportMp, Record<string, any> | undefined>

interface ConfigPluginOption extends MpConfig {
	/** 文件配置目录 */
	directory?: string
	/** 全局配置 */
	global?: Record<string, any>
}

const defaultMerged = (config: Record<string, any>) => config

const mpCli = {
	alipay: AlipayCli,
	lark: LarkCli,
	swan: SwanCli,
	tt: TtCli
}

export default definePlugin<ConfigPluginOption>((ctx, option) => {
	// 拷贝记录
	let copied = false
	let mergedFn = defaultMerged

	if (Reflect.has(mpCli, ctx.mpEnv)) {
		mergedFn = Reflect.get(mpCli, ctx.mpEnv)
	}

	const fileName = Reflect.get(fileNameMap, ctx.mpEnv)
	const outputPath = processResolve(ctx.paths.outputPath, fileName)

	// 配置文件目录
	const directory = Reflect.get(option, 'directory') ?? '/'
	// 构建小程序私有配置
	const dynamicConfig = Reflect.get(option, ctx.mpEnv)
	// 全部小程序公共配置
	const globalConfig = Reflect.get(option, 'global')

	const build = () => {
		// 如果配置文件不存在，则创建一个空文件
		if (!shell.test('-e', outputPath)) {
			shell.touch(outputPath)
			fs.writeFileSync(outputPath, '{}')
		}

		// env配置
		const env = platformEnv.loadEnv()
		// 从env配置中读取出全局配置项
		const partialEnv = platformEnv.filter(env, (key, value) => {
			if (Reflect.has(globalFieldMap, key)) {
				const newKey = Reflect.get(globalFieldMap, key)
				return { [newKey]: platformEnv.cleanValue(value) }
			}
		})

		try {
			// 读取小程序配置
			const temp = shell.cat(outputPath)
			const tempConfig = toJSON(temp)

			// 自定义配置
			const customConfig = extend(true, partialEnv, globalConfig, dynamicConfig)
			const finalConfig = extend(true, tempConfig, mergedFn(customConfig))

			shell.ShellString(
				JSON.stringify(finalConfig, null, 2)
			).to(
				outputPath
			)

			ctx.log('✨', 'Build finish.')
		} catch (err) {
			ctx.log('❌', 'Build error.')
			ctx.log(err)
		}
	}

	ctx.modifyMiniConfigs(({ configMap }) => {
		if (ctx.mpEnv === 'alipay') {
			alipayModifyConfig(configMap)
		}
	})

	ctx.onBuildFinish(async () => {
		if (!copied) {
			const mpConfigDir = processResolve(directory, ctx.mpEnv)

			// 拷贝小程序配置到生产目录
			// 直接覆盖配置
			if (shell.test('-d', mpConfigDir)) {
				await fs.copy(mpConfigDir, ctx.paths.outputPath, {
					overwrite: true
				})
			}
		}

		// 生成新的小程序配置
		build()
		copied = true
	})
}, {
	name: 'weejs-plugin-config',
	ignore: ['h5']
})
