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

if ! command -v npm 2>/dev/null 1>&2; then
  echo "Dependency missing: npm" 1>&2
  exit 1
fi

if ! command -v bower 2>/dev/null 1>&2; then
  echo "Dependency missing: bower" 1>&2
  exit 1
fi

if ! command -v python 2>/dev/null 1>&2; then
  echo "Dependency missing: python" 1>&2
  exit 1
fi

function usage() {
  echo "Usage: $0"
  echo ""
  echo "Options"
  echo ""
  echo "    -r <architecture>"
  echo "    -v <target version>"
  echo "    -t <target platform (node|electron)>"
  echo "    -f force install"
  echo "    -p production install"
  exit 0
}

ARGV_ARCHITECTURE=""
ARGV_TARGET_VERSION=""
ARGV_TARGET_PLATFORM=""
ARGV_FORCE=false
ARGV_PRODUCTION=false

while getopts ":r:v:t:fp" option; do
  case $option in
    r) ARGV_ARCHITECTURE=$OPTARG ;;
    v) ARGV_TARGET_VERSION=$OPTARG ;;
    t) ARGV_TARGET_PLATFORM=$OPTARG ;;
    f) ARGV_FORCE=true ;;
    p) ARGV_PRODUCTION=true ;;
    *) usage ;;
  esac
done

if [ -z "$ARGV_ARCHITECTURE" ] \
  || [ -z "$ARGV_TARGET_VERSION" ] \
  || [ -z "$ARGV_TARGET_PLATFORM" ]
then
  usage
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

rm -rf node_modules

NPM_INSTALL_OPTS="--build-from-source"

if [ "$ARGV_FORCE" == "true" ]; then
  NPM_INSTALL_OPTS="$NPM_INSTALL_OPTS --force"
fi

if [ "$ARGV_PRODUCTION" == "true" ]; then
  NPM_INSTALL_OPTS="$NPM_INSTALL_OPTS --production"
fi

npm install $NPM_INSTALL_OPTS

if [ "$ARGV_TARGET_PLATFORM" == "electron" ]; then
  rm -rf bower_components
  bower install --production --allow-root
fi
