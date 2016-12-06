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

function check_dep() {
  if ! command -v $1 2>/dev/null 1>&2; then
    echo "Dependency missing: $1" 1>&2
    exit 1
  fi
}

check_dep npm
check_dep python

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
  echo "    -f force install"
  echo "    -p production install"
  exit 1
}

ARGV_ARCHITECTURE=""
ARGV_TARGET_VERSION=""
ARGV_TARGET_PLATFORM=""
ARGV_TARGET_OPERATING_SYSTEM=""
ARGV_PREFIX=""
ARGV_FORCE=false
ARGV_PRODUCTION=false

while getopts ":r:v:t:s:x:fp" option; do
  case $option in
    r) ARGV_ARCHITECTURE=$OPTARG ;;
    v) ARGV_TARGET_VERSION=$OPTARG ;;
    t) ARGV_TARGET_PLATFORM=$OPTARG ;;
    s) ARGV_TARGET_OPERATING_SYSTEM=$OPTARG ;;
    x) ARGV_PREFIX=$OPTARG ;;
    f) ARGV_FORCE=true ;;
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

  # We require Visual Studio 2013 specifically since newer versions
  # lack command line build tools such as `lib.exe` and `cl.exe`.
  export GYP_MSVS_VERSION=2013

fi

if [ "$ARGV_TARGET_PLATFORM" == "electron" ]; then

  # Ensure native addons are compiled with the correct headers
  # See https://github.com/electron/electron/blob/master/docs/tutorial/using-native-node-modules.md
  export npm_config_disturl=https://atom.io/download/atom-shell
  export npm_config_runtime=electron

fi

export npm_config_target=$ARGV_TARGET_VERSION

if [ "$ARGV_ARCHITECTURE" == "x86" ]; then
  export npm_config_arch=ia32
else
  export npm_config_arch=$ARGV_ARCHITECTURE
fi

INSTALL_OPTS="--build-from-source"

if [ "$ARGV_FORCE" == "true" ]; then
  INSTALL_OPTS="$INSTALL_OPTS --force"
fi

if [ "$ARGV_PRODUCTION" == "true" ]; then
  INSTALL_OPTS="$INSTALL_OPTS --production"
fi

if [ -n "$ARGV_PREFIX" ]; then
  mkdir -p "$ARGV_PREFIX"
  ln -s "$PWD/package.json" "$ARGV_PREFIX/package.json"

  if [ -f "$PWD/npm-shrinkwrap.json" ]; then
    ln -s "$PWD/npm-shrinkwrap.json" "$ARGV_PREFIX/npm-shrinkwrap.json"
  fi

  pushd "$ARGV_PREFIX"
  npm install $INSTALL_OPTS
  popd

  rm -f "$ARGV_PREFIX/package.json"
  rm -f "$ARGV_PREFIX/npm-shrinkwrap.json"
else
  npm install $INSTALL_OPTS
fi
