import extend from 'extend'
import { pick } from '@txjs/shared'

const baseConfigKeys = [
  'format',
  'compileType',
  'miniprogramRoot',
  'pluginRoot',
  'compileOptions',
  'uploadExclude',
  'assetsInclude',
  'developOptions',
  'pluginResolution',
  'scripts'
]

const compileOptionKeys = [
  'component2',
  'typescript',
  'less',
  'treeShaking',
  'resolveAlias',
  'globalObjectMode',
  'transpile'
]

/** 支付宝兼容配置 */
export const alipayModifyConfig = (configMap: Record<string, any>) => {
	for (const key in configMap) {
    const content = Reflect.get(configMap, key) ?? {}
    const config = Reflect.get(content, 'content')

    if (!config) continue

    if (key === 'app.config') {
      const windowConfig = Reflect.get(config, 'window') ?? {}

      if (windowConfig.navigationStyle === 'custom') {
        Reflect.deleteProperty(windowConfig, 'navigationStyle')
        Reflect.set(windowConfig, 'transparentTitle', 'always')
        Reflect.set(windowConfig, 'titlePenetrate', 'YES')
        Reflect.set(config, 'window', windowConfig)
      }
    } else if (config.navigationStyle === 'default') {
      Reflect.deleteProperty(config, 'navigationStyle')
      Reflect.set(config, 'transparentTitle', 'none')
      Reflect.set(config, 'titlePenetrate', 'no')
    }

    Reflect.set(content, 'content', config)
  }
}

export default function alipay(config: Record<string, any> = {}) {
	const {
		compileOptions = {},
		...partial
	} = pick(config, baseConfigKeys, true)

  return extend(partial, {
    compileOptions: pick(compileOptions, compileOptionKeys, true)
  })
}
