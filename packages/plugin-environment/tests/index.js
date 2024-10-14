const { PlatformEnv } = require('../dist/index.cjs')
const { getNodeEnv, getMpEnv } = require('@weejs/plugin-utils')

console.log('node: ', getNodeEnv())
console.log('mp: ', getMpEnv())

const platformEnv = new PlatformEnv({
	watchListener: (args) => {
		console.log(args)
		console.log(platformEnv.loadEnv())
	}
})

console.log(platformEnv.loadEnv())