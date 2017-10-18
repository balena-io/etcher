const _ = require('lodash')

const getOS = str => {
  if (_.includes(str, 'darwin') || _.includes(str, '.dmg') || _.includes(str, 'mac')) {
    return 'macOS'
  } else if (_.includes(str, 'linux')) {
    return 'Linux'
  }
  return 'Windows'
}

const getArch = str => {
  if (
    _.includes(str, 'x64') ||
    _.includes(str, 'x86_64') ||
    _.includes(str, 'amd64') ||
    getOS(str) === 'macOS'
  ) {
    return 'x64'
  }
  return 'x86'
}

const getArchString = str => {
  switch (getArch(str)) {
    case 'x86':
      return '(32-bit)'
    case 'x64':
      return '(64-bit)'
  }
}

const getInstallerType = str => {
  if (getOS(str) === 'macOS') {
    return
  }

  if (getOS(str) === 'Linux') {
    return '(AppImage)'
  }

  if (_.includes(str, 'portable')) {
    return '(Portable)'
  } else {
    return '(Installer)'
  }
}

const isCLI = str => {
  return _.includes(str, 'cli')
}

const getFlow = str => {
  const funcs = [getOS]
  if (getOS(str) === 'macOS') {
    return funcs
  }

  funcs.push(getArch, getArchString)
  if (isCLI(str)) {
    return funcs
  }
  funcs.push(getInstallerType)
  return funcs
}

const packagePrettyName = str => {
  const start = isCLI(str) ? 'Etcher CLI for' : 'Etcher for'
  return getFlow(str)
    .reduce(
      (acc, fn) => {
        const addition = fn(str)
        addition && acc.push(addition)
        return acc
      },
      [start]
    )
    .join(' ')
}

const prepAssets = release => {
  release.assets = _(release.assets)
    .filter(item => {
      // Omit OS X ZIP files (used for update purposes)
      // Omit electron packages
      return !(
        (_.includes(item.name, '.zip') && getOS(item.name.toLowerCase()) === 'macOS') ||
        _.includes(item.name, 'electron')
      )
    })
    .map(item => {
      const str = item.name.toLowerCase()
      return Object.assign({},
        item,
        {
          name: packagePrettyName(str),
          os: getOS(str),
          arch: getArch(str),
          installerType: getInstallerType(str),
          type: isCLI(str) ? 'CLI' : 'Application'
        }
      )
    })
    .orderBy(
      [item => item.os.toLowerCase(), 'arch', 'installerType'],
      ['desc']
    )
    .value()

  return release
}

module.exports = prepAssets
