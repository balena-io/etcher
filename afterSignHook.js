'use strict'

const { notarize } = require('electron-notarize')
const { ELECTRON_SKIP_NOTARIZATION } = process.env

async function main(context) {
  const { electronPlatformName, appOutDir } = context
  if (electronPlatformName !== 'darwin' || ELECTRON_SKIP_NOTARIZATION === 'true') {
    return
  }

  const appName = context.packager.appInfo.productFilename
  const appleId = process.env.XCODE_APP_LOADER_EMAIL || 'accounts+apple@balena.io'
  const appleIdPassword = process.env.XCODE_APP_LOADER_PASSWORD

  // https://github.com/electron/notarize/blob/main/README.md
  await notarize({
    appBundleId: 'io.balena.etcher',
    appPath: `${appOutDir}/${appName}.app`,
    appleId,
    appleIdPassword
  })
}

exports.default = main
