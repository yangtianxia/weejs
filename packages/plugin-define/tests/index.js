const pluginDefine = require('../dist/index.cjs')

const pluginFn = pluginDefine.default((ctx, option) => {

}, {
  name: 'test-plugin',
  rules: {
    entry: {
      test: /\.js$/,
      message: '配置只支持js文件'
    }
  }
})

pluginFn({}, {
  entry: ''
})