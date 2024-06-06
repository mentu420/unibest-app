import { execSync } from 'child_process'
import { config } from 'dotenv'
import { readFileSync, writeFileSync } from 'fs'
import inquirer from 'inquirer'
import CI from 'miniprogram-ci'
import os from 'os'

config({
  path: './env/.env',
})

const [_, __, environment, paramVersion] = process.argv
let version = paramVersion
console.log(`dist/build/${environment}/mp-weixin`)
;(async () => {
  if (environment === 'development') {
    version = process.env.npm_package_version
  }
  if (!version) {
    version = await inquirer
      .prompt([
        {
          type: 'input',
          name: 'version',
          message: '请输入版本号',
          default: process.env.npm_package_version,
        },
      ])
      .then((res) => res.version)
  }
  updatePackageVersion(version)
  execSync(`npm run build:${environment}`, { stdio: 'inherit' })
  console.log('-----上传小程序中-----')
  const project = new CI.Project({
    appid: process.env.VITE_APP_APP_ID,
    type: 'miniProgram',
    projectPath: `dist/build/${environment}/mp-weixin`,
    // 上传密钥路径
    privateKeyPath: './private.key',
    ignores: ['node_modules/**/*'],
  })
  await CI.upload({
    project,
    version,
    robot: environment === 'production' ? 2 : 1,
    threads: os.cpus.length,
    setting: {
      es6: true,
      es7: true,
      // autoPrefixWXSS: true,
      // minify: true,
      // minifyJS: true,
      // minifyWXSS: true
    },
  })
  console.log('-----上传小程序成功-----')
})()

function updatePackageVersion(version) {
  const packageJSON = JSON.parse(readFileSync('./package.json').toString())
  packageJSON.version = version
  writeFileSync('./package.json', JSON.stringify(packageJSON, null, 2))
}
