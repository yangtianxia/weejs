import shell from 'shelljs'
import { processResolve } from '@weejs/plugin-utils'
import { defineDeclare } from './utils'

const classPattern = /\.van-icon-(.+):before\s+{\n.+\n}/ig

export default defineDeclare('vant-icon', () => {
	const vantIconPath = processResolve('node_modules/@vant/icons')

	if (shell.test('-e', vantIconPath)) {
		const temp = shell.cat(processResolve(vantIconPath, 'src/common.less'))
		const result = [] as string[]

		temp
			.toString()
			.replaceAll(
				classPattern,
				(_, $1) => {
					result.push(`'${$1}'`)
					return ''
				}
			)

		return `type VantIconNames = ${result.join(' | ')}`
	}
})
