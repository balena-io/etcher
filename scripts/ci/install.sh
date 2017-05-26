#!/bin/bash

###
# Copyright 2017 resin.io
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

set -e
set -u

function usage() {
  echo "Usage: $0"
  echo ""
  echo "Options"
  echo ""
  echo "    -o <operating system>"
  echo "    -r <architecture>"
  exit 1
}

ARGV_OPERATING_SYSTEM=""
ARGV_ARCHITECTURE=""

while getopts ":o:r:" option; do
  case $option in
    o) ARGV_OPERATING_SYSTEM=$OPTARG ;;
    r) ARGV_ARCHITECTURE=$OPTARG ;;
    *) usage ;;
  esac
done

if [ -z "$ARGV_OPERATING_SYSTEM" ] || [ -z "$ARGV_ARCHITECTURE" ]; then
  usage
fi

if [ "$ARGV_OPERATING_SYSTEM" == "linux" ]; then
  ./scripts/build/docker/run-command.sh \
    -r "$ARGV_ARCHITECTURE" \
    -s "$(pwd)" \
    -c "make info && make electron-develop"
else
  if [ "$ARGV_OPERATING_SYSTEM" == "darwin" ]; then
    ./scripts/build/check-dependency.sh brew
    brew install afsctool jq
  elif [ "$ARGV_OPERATING_SYSTEM" == "win32" ]; then
    ./scripts/build/check-dependency.sh choco
    choco install nsis -version 2.51
    choco install jq
    choco install curl
  else
    echo "Unsupported operating system: $ARGV_OPERATING_SYSTEM" 1>&2
    exit 1
  fi

  ./scripts/build/check-dependency.sh npm
  ./scripts/build/check-dependency.sh pip
  ./scripts/build/check-dependency.sh make

  npm config set spin=false
  npm install -g uglify-es@3.0.11
  pip install -r requirements.txt

  make info
  make electron-develop
fi
