#!/usr/bin/env node

'use strict'

const { readFile, writeFile } = require('fs')
const { join } = require('path')
const { default: readEnv } = require('read-env')
const { promisify } = require('util')

const readFileAsync = promisify(readFile)
const writeFileAsync = promisify(writeFile)

const ETCHER_CONFIG_FILENAME = '/root/.config/Electron/config.json'

async function readConfig() {
  try {
    return JSON.parse(await readFileAsync(ETCHER_CONFIG_FILENAME, 'utf8'))
  } catch (error) {
    if (error.code === 'ENOENT') {
      return {}
    }
    throw error
  }
}

async function main() {
  const config = {
    ...await readConfig(),
    ...readEnv('URL_LAUNCHER'),
    ...readEnv('ELECTRON'),
    ...readEnv('ETCHER'),
  }
  await writeFileAsync(ETCHER_CONFIG_FILENAME, JSON.stringify(config, null, 2))
}

main()
