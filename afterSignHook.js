'use strict'

const { notarize } = require('electron-notarize')
const { ELECTRON_SKIP_NOTARIZATION } = process.env

async function main(context) {
  const { electronPlatformName, appOutDir } = context
  if (electronPlatformName !== 'darwin' || ELECTRON_SKIP_NOTARIZATION === 'true') {
    return
  }

  const appName = context.packager.appInfo.productFilename
  const appleId = 'accounts+apple@balena.io'

  await notarize({
    appBundleId: 'io.balena.etcher',
    appPath: `${appOutDir}/${appName}.app`,
    appleId,
    appleIdPassword: `@keychain:Application Loader: ${appleId}`
  })
}

exports.default = main
