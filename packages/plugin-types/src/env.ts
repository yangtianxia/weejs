import { json2ts } from 'json-ts'
import { platformEnv } from '@weejs/plugin-environment'
import { defineDeclare } from './utils'

export default defineDeclare('env', () => {
	const env = platformEnv.loadEnv()
	const content = json2ts(JSON.stringify(env), {
		prefix: '',
		rootName: 'ProcessEnv'
	})

	return `namespace NodeJS {
		${content}
	}`
})
