import extend from 'extend'
import { pick } from '@txjs/shared'

const baseConfigKeys = [
  'miniprogramRoot',
  'setting',
  'appid',
  'projectname'
]

const settingConfigKeys = [
  'es6',
  'minified',
  'babelSetting'
]

export default function lark(config: Record<string, any> = {}) {
  const {
		setting = {},
		...partial
	} = pick(config, baseConfigKeys, true)

  return extend(partial, {
    setting: pick(setting, settingConfigKeys, true)
  })
}
