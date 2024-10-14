const { cosmiconfig, cosmiconfigSync } = require('cosmiconfig')

/// 注意：实际测试需要将配置文件移到项目根目录下

const explorer = cosmiconfig('condition')
// const explorerSync = cosmiconfigSync('condition')

// const result = explorer.load(processResolve('./tests/config.mjs'))

// const result = explorerSync.search()
// console.log(result)

const exec = async () => {
  const result1 = await explorer.search()
  console.log(result1)
  console.log(result1.config())
}

exec()