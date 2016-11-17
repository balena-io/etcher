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

function usage() {
  echo "Usage: $0"
  echo ""
  echo "Options"
  echo ""
  echo "    -n <application name>"
  echo "    -r <application architecture>"
  echo "    -v <application version>"
  echo "    -b <application bundle id>"
  echo "    -c <application copyright>"
  echo "    -t <application category>"
  echo "    -i <application icon (.icns)>"
  echo "    -e <electron version>"
  echo "    -o <output>"
  exit 0
}

ARGV_APPLICATION_NAME=""
ARGV_ARCHITECTURE=""
ARGV_VERSION=""
ARGV_BUNDLE_ID=""
ARGV_COPYRIGHT=""
ARGV_CATEGORY=""
ARGV_ICON=""
ARGV_ELECTRON_VERSION=""
ARGV_OUTPUT=""

while getopts ":n:r:v:b:c:t:i:e:o:" option; do
  case $option in
    n) ARGV_APPLICATION_NAME="$OPTARG" ;;
    r) ARGV_ARCHITECTURE="$OPTARG" ;;
    v) ARGV_VERSION="$OPTARG" ;;
    b) ARGV_BUNDLE_ID="$OPTARG" ;;
    c) ARGV_COPYRIGHT="$OPTARG" ;;
    t) ARGV_CATEGORY="$OPTARG" ;;
    i) ARGV_ICON="$OPTARG" ;;
    e) ARGV_ELECTRON_VERSION="$OPTARG" ;;
    o) ARGV_OUTPUT="$OPTARG" ;;
    *) usage ;;
  esac
done

if [ -z "$ARGV_APPLICATION_NAME" ] \
  || [ -z "$ARGV_ARCHITECTURE" ] \
  || [ -z "$ARGV_VERSION" ] \
  || [ -z "$ARGV_BUNDLE_ID" ] \
  || [ -z "$ARGV_COPYRIGHT" ] \
  || [ -z "$ARGV_CATEGORY" ] \
  || [ -z "$ARGV_ICON" ] \
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

$ELECTRON_PACKAGER . "$ARGV_APPLICATION_NAME" \
  --platform=darwin \
  --arch="$ARGV_ARCHITECTURE" \
  --version="$ARGV_ELECTRON_VERSION" \
  --ignore="$(node scripts/packageignore.js)" \
  --asar \
  --app-copyright="$ARGV_COPYRIGHT" \
  --app-version="$ARGV_VERSION" \
  --build-version="$ARGV_VERSION" \
  --helper-bundle-id="$ARGV_BUNDLE_ID-helper" \
  --app-bundle-id="$ARGV_BUNDLE_ID" \
  --app-category-type="$ARGV_CATEGORY" \
  --icon="$ARGV_ICON" \
  --overwrite \
  --out="$OUTPUT_DIRNAME"

ELECTRON_PACKAGE_OUTPUT=$OUTPUT_DIRNAME/$ARGV_APPLICATION_NAME-darwin-$ARGV_ARCHITECTURE

if [ "$ELECTRON_PACKAGE_OUTPUT" != "$ARGV_OUTPUT" ]; then
  mv "$ELECTRON_PACKAGE_OUTPUT" "$ARGV_OUTPUT"
fi

rm "$ARGV_OUTPUT/LICENSE"
rm "$ARGV_OUTPUT/LICENSES.chromium.html"
rm "$ARGV_OUTPUT/version"
