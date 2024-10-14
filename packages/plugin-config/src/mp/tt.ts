import extend from 'extend'
import { pick } from '@txjs/shared'

const baseConfigKeys = [
  'appid',
  'miniprogramRoot',
  'setting',
  'projectname'
]

const settingConfigKeys = [
  'es6',
  'urlCheck',
  'autoCompile',
  'mockUpdate',
  'scripts',
  'mockLogin'
]

export default function tt(config: Record<string, any> = {}) {
	const {
		setting = {},
		...partial
	}  = pick(config, baseConfigKeys, true)

  return extend(partial, {
    setting: pick(setting, settingConfigKeys, true)
  })
}
