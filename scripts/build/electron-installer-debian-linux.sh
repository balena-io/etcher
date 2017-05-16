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
if [[ "$OS" != "Linux" ]]; then
  echo "This script is only meant to be run in GNU/Linux" 1>&2
  exit 1
fi

./scripts/build/check-dependency.sh electron-installer-debian

function usage() {
  echo "Usage: $0"
  echo ""
  echo "Options"
  echo ""
  echo "    -p <application directory>"
  echo "    -r <architecture>"
  echo "    -c <debian configuration (.json)>"
  echo "    -o <output directory>"
  exit 1
}

ARGV_DIRECTORY=""
ARGV_ARCHITECTURE=""
ARGV_DEBIAN_CONFIGURATION=""
ARGV_OUTPUT=""

while getopts ":p:r:c:o:" option; do
  case $option in
    p) ARGV_DIRECTORY="$OPTARG" ;;
    r) ARGV_ARCHITECTURE="$OPTARG" ;;
    c) ARGV_DEBIAN_CONFIGURATION="$OPTARG" ;;
    o) ARGV_OUTPUT="$OPTARG" ;;
    *) usage ;;
  esac
done

if [ -z "$ARGV_DIRECTORY" ] \
  || [ -z "$ARGV_ARCHITECTURE" ] \
  || [ -z "$ARGV_DEBIAN_CONFIGURATION" ] \
  || [ -z "$ARGV_OUTPUT" ]
then
  usage
fi

DEBIAN_ARCHITECTURE=$(./scripts/build/architecture-convert.sh -r "$ARGV_ARCHITECTURE" -t debian)

cp scripts/build/debian/etcher-electron.sh "$ARGV_DIRECTORY"
electron-installer-debian \
  --src "$ARGV_DIRECTORY" \
  --dest "$ARGV_OUTPUT" \
  --config "$ARGV_DEBIAN_CONFIGURATION" \
  --arch "$DEBIAN_ARCHITECTURE"
rm "$ARGV_DIRECTORY/etcher-electron.sh"
