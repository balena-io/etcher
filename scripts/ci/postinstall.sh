#!/usr/bin/env bash

set -ea

[[ "$VERBOSE" =~ on|On|Yes|yes|true|True ]] && set -x

# use specified or fallback to platform architecture
arch="${arch:-$(node -e 'console.log(os.arch())')}"

# FIXME: remove when lzma-native ships with win-arm64 suport
# https://github.com/addaleax/lzma-native/issues/132
pushd node_modules/lzma-native
# https://docs.npmjs.com/cli/v9/using-npm/config#environment-variables
NPM_CONFIG_arch="${arch}" \
  NPM_CONFIG_target_arch="${NPM_CONFIG_arch}" npm i

# https://github.com/prebuild/prebuildify#options
# https://www.npmjs.com/package/node-gyp-build
PREBUILD_ARCH="${NPM_CONFIG_arch}" npm run prebuild
popd

# FIXME: (re)build for the latest version of electron, since v13.x uses ancient node-gyp
# https://releases.electronjs.org/releases/stable
electron_version="${ELECTRON_VERSION:-$(npm view electron --json | jq -r '.version')}"

# https://github.com/electron/rebuild#cli-arguments
electron-rebuild \
  --types prod,dev,optional \
  --arch "${arch}" \
  --version "${electron_version}"
