'use strict'

const { execFile } = require('child_process')
const { argv, env } = require('process')
const { join } = require('path')
const { promisify } = require('util')

const execFileAsync = promisify(execFile)

const SUCCESSFUL_AUTH_MARKER = 'AUTHENTICATION SUCCEEDED'
const EXPECTED_SUCCESSFUL_AUTH_MARKER = `${SUCCESSFUL_AUTH_MARKER}\n`

/* eslint-disable-next-line require-jsdoc */
const getAppPath = () => {
  for (const arg of argv) {
    /* eslint-disable-next-line lodash/prefer-lodash-method */
    const [ option, value ] = arg.split('=')
    if (option === '--app-path') {
      return value
    }
  }
  /* eslint-disable-next-line quotes */
  throw new Error("Couldn't find --app-path= in argv")
}

exports.sudo = async (command) => {
  try {
    const { stdout, stderr } = await execFileAsync(
      'sudo',
      [ '--askpass', 'sh', '-c', `echo ${SUCCESSFUL_AUTH_MARKER} && ${command}` ],
      {
        encoding: 'utf8',
        env: {
          PATH: env.PATH,
          SUDO_ASKPASS: join(getAppPath(), __dirname, 'sudo-askpass.osascript.js')
        }
      }
    )
    return {
      cancelled: false,
      stdout: stdout.slice(EXPECTED_SUCCESSFUL_AUTH_MARKER.length),
      stderr
    }
  } catch (error) {
    /* eslint-disable-next-line no-magic-numbers */
    if (error.code === 1) {
      /* eslint-disable-next-line lodash/prefer-lodash-method */
      if (!error.stdout.startsWith(EXPECTED_SUCCESSFUL_AUTH_MARKER)) {
        return { cancelled: true }
      }
      error.stdout = error.stdout.slice(EXPECTED_SUCCESSFUL_AUTH_MARKER.length)
    }
    throw error
  }
}
