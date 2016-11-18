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

OS=$(uname)
if [[ "$OS" != "Darwin" ]]; then
  echo "This script is only meant to be run in OS X" 1>&2
  exit 1
fi

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
  echo "    -e <electron version>"
  exit 0
}

ARGV_ARCHITECTURE=""
ARGV_ELECTRON_VERSION=""

while getopts ":r:e:" option; do
  case $option in
    r) ARGV_ARCHITECTURE=$OPTARG ;;
    e) ARGV_ELECTRON_VERSION=$OPTARG ;;
    *) usage ;;
  esac
done

if [ -z "$ARGV_ARCHITECTURE" ] || [ -z "$ARGV_ELECTRON_VERSION" ]; then
  usage
fi

# Ensure native addons are compiled with the correct headers
# See https://github.com/electron/electron/blob/master/docs/tutorial/using-native-node-modules.md
export npm_config_disturl=https://atom.io/download/atom-shell
export npm_config_runtime=electron
export npm_config_target=$ARGV_ELECTRON_VERSION

if [ "$ARGV_ARCHITECTURE" == "x86" ]; then
  export npm_config_arch=ia32
else
  export npm_config_arch=$ARGV_ARCHITECTURE
fi

rm -rf node_modules bower_components
npm install --build-from-source
bower install --production
