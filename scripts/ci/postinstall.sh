#!/usr/bin/env bash

set -ea

[[ "$VERBOSE" =~ on|On|Yes|yes|true|True ]] && set -x

# use specified or fallback to platform architecture
arch="${arch:-$(node -e 'console.log(os.arch())')}"

# FIXME: (re)build for the latest version of electron, since v13.x uses ancient node-gyp
# https://releases.electronjs.org/releases/stable
electron_version="${ELECTRON_VERSION:-$(npm view electron --json | jq -r '.version')}"

# https://github.com/electron/rebuild#cli-arguments
electron-rebuild \
  --types prod,dev,optional \
  --arch "${arch}" \
  --version "${electron_version}"
