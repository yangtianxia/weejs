import { fileURLToPath } from 'node:url'
import { dirname } from 'node:path'
import shell from 'shelljs'
import webpack from 'webpack'
import cleanCSS from 'clean-css'
import definePlugin from '@weejs/plugin-define'
import { isString, isPlainObject, isArray } from '@txjs/bool'
import { platformEnv } from '@weejs/plugin-environment'
import { processResolve, resolve } from '@weejs/plugin-utils'
import { getColorPalettes } from './colors'

export * from './interface'

export { getColorPalettes }

let $$dirname: string | undefined

if (typeof __dirname === 'undefined') {
	$$dirname = dirname(fileURLToPath(import.meta.url))
} else {
	$$dirname = __dirname
}

const pollenConfigPath = resolve($$dirname, '../', 'pollen.config.mjs')

const { RawSource } = webpack.sources

const formatterMiniConfig = (
	config: any,
	palettes: Record<string, any>
) => {
	for (const key in config) {
		const target = config[key] as unknown

    if (isPlainObject(target)) {
      formatterMiniConfig(target, palettes)
    }
		else if (isArray<any>(target)) {
			target.forEach((item: any) => {
				if (isPlainObject(item) || isArray(item)) {
          formatterMiniConfig(item, palettes)
        }
			})
    }
		else if (isString(target) && (target as any).startsWith('@')) {
      const result = (target as any).slice(1)
			if (Reflect.has(palettes, result)) {
				Reflect.set(config, key, Reflect.get(palettes, result))
			}
    }
	}
}

export default definePlugin((ctx) => {
	let packed = false
	const isWeapp = ctx.mpEnv === 'weapp'
	const targetCSSPath = processResolve(ctx.outputWeejs, 'style/theme.css')

	ctx.modifyMiniConfigs(async ({ configMap }) => {
		// 微信小程序暗黑模式配置
		if (!isWeapp && platformEnv.isTruly(process.env.WEEJS_DARKMODE)) {
			// 注入配置，开启微信小程序暗黑模式
			if (Reflect.has(configMap, 'app.config')) {
				const content = Reflect.get(configMap, 'app.config')
				const appConfig = Reflect.get(content, 'content')

				// 启用微信小程序暗黑模式配置
        Reflect.set(appConfig, 'darkmode', true)
				// 该文件已在构建开始生成
        Reflect.set(appConfig, 'themeLocation', 'theme.json')
        Reflect.set(content, 'content', appConfig)
			}
		}
		// 修改不支持暗黑模式配置文件的平台
		// e.g
		// {
		//	"window": {
		//		"navigationBarBackgroundColor": "@navBgColor",
		//		"navigationBarTextStyle": "@navTxtStyle"
		//	}
		// }
		//
		// 将@navBgColor、@navTxtStyle恢复成原来值
		else if (ctx.mpEnv !== 'h5') {
			const colorsPalettes = await getColorPalettes()
			Object.keys(configMap).forEach((key) => {
        const content = Reflect.get(configMap, key)
        const pageConfig = Reflect.get(content, 'content')

        // 将暗黑模式配置的变量
        // 重新改为默认配置原始值
        formatterMiniConfig(pageConfig, colorsPalettes.light)
        Reflect.set(content, 'content', pageConfig)
      })
		}
	})

	ctx.modifyBuildAssets(({ assets }) => {
    for (const path in assets) {
			// 匹配不同平台app样式文件
      // 将theme样式文件插入至app样式文件头部
      if (/^app\.(.+)ss$/.test(path)) {
        if (shell.test('-e', targetCSSPath)) {
          const source = shell
						.cat(targetCSSPath)
						.toString()
          const output = new cleanCSS().minify(source)
          const content = Reflect.get(assets, path)
          const newContent = `${`/**WEEJS-CSS-START*/${output.styles}/**WEEJS-CSS-END*/\n`}${content.source()}`
          Reflect.set(assets, path, new RawSource(newContent))
        }
        break
      }
    }
  })

	const build = async () => {
		// 生成pollen
		if (shell.test('-e', pollenConfigPath)) {
			shell.exec(`pollen --config ${pollenConfigPath}`)
		}

		// 微信小程序theme配置
		if (isWeapp && platformEnv.isTruly(process.env.WEEJS_DARKMODE)) {
			const colorsPalettes = await getColorPalettes()
			const theme = JSON.stringify(colorsPalettes, null, 2)
			const outputPath = processResolve(ctx.paths.outputPath, 'theme.json')

			shell.ShellString(
				theme
			).to(
				outputPath
			)
		}

		ctx.log('✨', 'Build finish.')
	}

	// 使用setTimeout为了延迟，生产文件夹还没有创建的问题
	ctx.onBuildStart(() => setTimeout(build, 1))

	ctx.onBuildFinish(() => {
		if (packed) {
			build()
		}
		packed = true
	})
}, {
	name: 'weejs-plugin-theme'
})
