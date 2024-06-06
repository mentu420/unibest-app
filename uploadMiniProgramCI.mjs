import { execSync } from 'child_process'
import { config } from 'dotenv'
import ci from 'miniprogram-ci'
import { cpus } from 'os'

config({
  path: './env/.env',
})

const randomVersion = () => {
  const majorVersion = 1
  const minorVersion = Math.floor(Math.random() * 100) // 生成 0 到 99 之间的随机整数
  const patchVersion = Math.floor(Math.random() * 100) // 生成 0 到 99 之间的随机整数
  return `${majorVersion}.${minorVersion}.${patchVersion}`
}

const [_, __, environment, paramVersion] = process.argv
let version = environment === 'production' ? paramVersion.replace(/v|\n/gi, '') : randomVersion()
;(async () => {
  if (!checkVersion(version)) {
    console.log('请输入正确版本号 xx.xx.xx')
    return
  }
  console.log(`-----上传小程序中(${version})-----`)
  const project = new ci.Project({
    appid: process.env.VITE_APP_APP_ID,
    type: 'miniProgram',
    projectPath: `dist/build/${environment}/mp-weixin`,
    // 上传密钥路径
    privateKeyPath: './private.key',
    ignores: ['node_modules/**/*'],
  })
  const gitUserName = 'CI-boot'
  const commitHistory = execSync('git log --pretty=format:"%s" -4').toString().replace(/\n/g, '、')
  await ci.upload({
    project,
    version,
    robot: environment === 'production' ? 2 : 1,
    threads: cpus.length,
    desc: `${environment}(${gitUserName}): ${commitHistory}`,
    setting: {
      es6: true,
      es7: true,
      // autoPrefixWXSS: true,
      // minify: true,
      // minifyJS: true,
      // minifyWXSS: true
    },
  })
  console.log(`-----上传小程序成功(${version})-----`)
})()

function checkVersion(version) {
  return /^\d+\.\d+\.\d+$/.test(version)
}
