#!/bin/bash

###
# Copyright 2016 resin.io
#
# Licensed under the Apache License, Version 2.0 (the "License");
# you may not use this file except in compliance with the License.
# You may obtain a copy of the License at
#
#   http://www.apache.org/licenses/LICENSE-2.0
#
# Unless required by applicable law or agreed to in writing, software
# distributed under the License is distributed on an "AS IS" BASIS,
# WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
# See the License for the specific language governing permissions and
# limitations under the License.
###

set -u
set -e

./scripts/build/check-dependency.sh npm
./scripts/build/check-dependency.sh python

function usage() {
  echo "Usage: $0"
  echo ""
  echo "Options"
  echo ""
  echo "    -r <architecture>"
  echo "    -v <target version>"
  echo "    -t <target platform (node|electron)>"
  echo "    -s <target operating system>"
  echo "    -x <install prefix>"
  echo "    -p production install"
  exit 1
}

ARGV_ARCHITECTURE=""
ARGV_TARGET_VERSION=""
ARGV_TARGET_PLATFORM=""
ARGV_TARGET_OPERATING_SYSTEM=""
ARGV_PREFIX=""
ARGV_PRODUCTION=false

while getopts ":r:v:t:s:x:p" option; do
  case $option in
    r) ARGV_ARCHITECTURE=$OPTARG ;;
    v) ARGV_TARGET_VERSION=$OPTARG ;;
    t) ARGV_TARGET_PLATFORM=$OPTARG ;;
    s) ARGV_TARGET_OPERATING_SYSTEM=$OPTARG ;;
    x) ARGV_PREFIX=$OPTARG ;;
    p) ARGV_PRODUCTION=true ;;
    *) usage ;;
  esac
done

if [ -z "$ARGV_ARCHITECTURE" ] \
  || [ -z "$ARGV_TARGET_VERSION" ] \
  || [ -z "$ARGV_TARGET_PLATFORM" ] \
  || [ -z "$ARGV_TARGET_OPERATING_SYSTEM" ]
then
  usage
fi

if [ "$ARGV_TARGET_OPERATING_SYSTEM" == "win32" ]; then
  export GYP_MSVS_VERSION=2015
fi

if [ "$ARGV_TARGET_PLATFORM" == "electron" ]; then

  # Ensure native addons are compiled with the correct headers
  # See https://github.com/electron/electron/blob/master/docs/tutorial/using-native-node-modules.md
  export npm_config_disturl=https://atom.io/download/electron
  export npm_config_runtime=electron

fi

export npm_config_target=$ARGV_TARGET_VERSION
export npm_config_build_from_source=true

ELECTRON_ARCHITECTURE=$(./scripts/build/architecture-convert.sh -r "$ARGV_ARCHITECTURE" -t node)
export npm_config_arch=$ELECTRON_ARCHITECTURE

INSTALL_OPTS=""

if [ "$ARGV_PRODUCTION" == "true" ]; then
  INSTALL_OPTS="$INSTALL_OPTS --production"
fi

function run_install() {

  npm install $INSTALL_OPTS

  # When changing between target architectures, rebuild all dependencies,
  # since compiled add-ons will not work otherwise.
  npm rebuild

  if [ "$ARGV_PRODUCTION" == "true" ]; then

    # Turns out that if `npm-shrinkwrap.json` contains development
    # dependencies then `npm install --production` will also install
    # those, despite knowing, based on `package.json`, that they are
    # really development dependencies. As a workaround, we manually
    # delete the development dependencies using `npm prune`.
    npm prune --production

  fi
}

if [ -n "$ARGV_PREFIX" ]; then
  cp "$PWD/package.json" "$ARGV_PREFIX/package.json"

  if [ -f "$PWD/npm-shrinkwrap.json" ]; then
    cp "$PWD/npm-shrinkwrap.json" "$ARGV_PREFIX/npm-shrinkwrap.json"
  fi

  if [ -f "$PWD/binding.gyp" ]; then
    cp "$PWD/binding.gyp" "$ARGV_PREFIX/binding.gyp"
  fi

  # Handle native code, if any
  if [ -d "$PWD/src" ]; then
    cp -RLf "$PWD/src" "$ARGV_PREFIX/src"
  fi

  pushd "$ARGV_PREFIX"
  run_install
  popd

  rm -f "$ARGV_PREFIX/package.json"
  rm -f "$ARGV_PREFIX/npm-shrinkwrap.json"
  rm -f "$ARGV_PREFIX/binding.gyp"
  rm -rf "$ARGV_PREFIX/src"
else
  run_install
fi
