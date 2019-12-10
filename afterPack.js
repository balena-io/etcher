'use strict'

const cp = require('child_process')
const fs = require('fs')
const outdent = require('outdent')
const path = require('path')

exports.default = function(context) {
  if (context.packager.platform.name !== 'linux') {
    return
  }
  const scriptPath = path.join(context.appOutDir, context.packager.executableName)
  const binPath = scriptPath + '.bin'
  cp.execFileSync('mv', [scriptPath, binPath])
  fs.writeFileSync(
    scriptPath,
    outdent`
      #!/bin/bash
      if [[ $EUID -ne 0 ]] || [[ $ELECTRON_RUN_AS_NODE ]]; then
        "\${BASH_SOURCE%/*}"/${context.packager.executableName}.bin "$@"
      else
        "\${BASH_SOURCE%/*}"/${context.packager.executableName}.bin "$@" --no-sandbox
      fi
    `
  )
  cp.execFileSync('chmod', ['+x', scriptPath])
}
