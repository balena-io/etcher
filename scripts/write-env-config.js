#!/usr/bin/env node

'use strict'

const fs = require('fs')
const path = require('path')
const _ = require('lodash')
const readEnv = require('read-env').default

const envConfig = _.assign(
  {
    userDataDir: '/data/.config/etcher',
    enableHwAcceleration: false,
    resinUpdateLock: true,
    appDataDir: '/data/.config',
    touch: true,
    touchSimulate: true,
    frame: false,
    width: 1024,
    height: 600,
    title: 'Etcher Pro'
  },
  readEnv('URL_LAUNCHER'),
  readEnv('ELECTRON'),
  readEnv('ETCHER')
)

const envConfigFilename = path.join(envConfig.userDataDir, 'config.json')

fs.readFile(envConfigFilename, { encoding: 'utf8' }, (err, contents = '{}') => {
  if (err && _.get(err, [ 'code' ]) !== 'ENOENT') {
    throw err
  }

  const data = JSON.parse(contents)
  const config = _.assign({}, data, envConfig)
  // eslint-disable-next-line no-magic-numbers
  const configJsonString = JSON.stringify(config, null, 2)

  fs.writeFileSync(envConfigFilename, `${configJsonString}\n`)
})
