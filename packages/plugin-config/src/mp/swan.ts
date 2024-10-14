import extend from 'extend'
import { pick } from '@txjs/shared'

const baseConfigKeys = [
  'smartProgramRoot',
  'appid',
  'compilation-args',
  'compileType',
  'setting',
  'developType',
  'editor',
  'host',
  'preview',
  'publish',
  'swan'
]

const settingConfigKeys = ['urlCheck']

export default function swan(config: Record<string, any> = {}) {
	const {
		projectname,
		setting = {},
		...partial
	} = pick(config, baseConfigKeys, true)

  return extend(partial, {
    host: projectname,
    setting: pick(setting, settingConfigKeys, true)
  })
}
