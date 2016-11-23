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

function usage() {
  echo "Usage: $0"
  echo ""
  echo "Options"
  echo ""
  echo "    -n <application name>"
  echo "    -r <application architecture>"
  echo "    -v <application version>"
  echo "    -e <electron version>"
  echo "    -o <output>"
  exit 0
}

ARGV_APPLICATION_NAME=""
ARGV_ARCHITECTURE=""
ARGV_VERSION=""
ARGV_ELECTRON_VERSION=""
ARGV_OUTPUT=""

while getopts ":n:r:v:e:o:" option; do
  case $option in
    n) ARGV_APPLICATION_NAME="$OPTARG" ;;
    r) ARGV_ARCHITECTURE="$OPTARG" ;;
    v) ARGV_VERSION="$OPTARG" ;;
    e) ARGV_ELECTRON_VERSION="$OPTARG" ;;
    o) ARGV_OUTPUT="$OPTARG" ;;
    *) usage ;;
  esac
done

if [ -z "$ARGV_APPLICATION_NAME" ] \
  || [ -z "$ARGV_ARCHITECTURE" ] \
  || [ -z "$ARGV_VERSION" ] \
  || [ -z "$ARGV_ELECTRON_VERSION" ] \
  || [ -z "$ARGV_OUTPUT" ]
then
  usage
fi

ELECTRON_PACKAGER=./node_modules/.bin/electron-packager

if [ ! -x $ELECTRON_PACKAGER ]; then
  echo "Couldn't find $ELECTRON_PACKAGER" 1>&2
  echo "Have you installed the dependencies first?" 1>&2
  exit 1
fi

OUTPUT_DIRNAME=$(dirname "$ARGV_OUTPUT")

mkdir -p "$OUTPUT_DIRNAME"

ELECTRON_PACKAGER_ARCH=$ARGV_ARCHITECTURE
if [ "$ELECTRON_PACKAGER_ARCH" == "x86" ]; then
  ELECTRON_PACKAGER_ARCH="ia32"
fi

ELECTRON_PACKAGE_OUTPUT=$OUTPUT_DIRNAME/$ARGV_APPLICATION_NAME-linux-$ARGV_ARCHITECTURE

rm -rf "$ELECTRON_PACKAGE_OUTPUT"

$ELECTRON_PACKAGER . "$ARGV_APPLICATION_NAME" \
  --platform=linux \
  --arch="$ELECTRON_PACKAGER_ARCH" \
  --version="$ARGV_ELECTRON_VERSION" \
  --ignore="$(node scripts/packageignore.js)" \
  --asar \
  --app-version="$ARGV_VERSION" \
  --build-version="$ARGV_VERSION" \
  --overwrite \
  --out="$OUTPUT_DIRNAME"

if [ "$ELECTRON_PACKAGE_OUTPUT" != "$ARGV_OUTPUT" ]; then
  mv "$ELECTRON_PACKAGE_OUTPUT" "$ARGV_OUTPUT"
fi

# Transform binary to lowercase
FINAL_BINARY_FILENAME=$(echo "$ARGV_APPLICATION_NAME" | tr '[:upper:]' '[:lower:]')
mv "$ARGV_OUTPUT/$ARGV_APPLICATION_NAME" "$ARGV_OUTPUT/$FINAL_BINARY_FILENAME"

chmod a+x "$ARGV_OUTPUT"/*.so*
