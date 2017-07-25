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
  echo "    -d <appdir>"
  echo "    -r <application architecture>"
  echo "    -w <download directory>"
  echo "    -o <output>"
  exit 1
}

ARGV_APPDIR=""
ARGV_ARCHITECTURE=""
ARGV_DOWNLOAD_DIRECTORY=""
ARGV_OUTPUT=""

while getopts ":d:r:w:o:" option; do
  case $option in
    d) ARGV_APPDIR="$OPTARG" ;;
    r) ARGV_ARCHITECTURE="$OPTARG" ;;
    w) ARGV_DOWNLOAD_DIRECTORY="$OPTARG" ;;
    o) ARGV_OUTPUT="$OPTARG" ;;
    *) usage ;;
  esac
done

if [ -z "$ARGV_APPDIR" ] \
  || [ -z "$ARGV_ARCHITECTURE" ] \
  || [ -z "$ARGV_DOWNLOAD_DIRECTORY" ] \
  || [ -z "$ARGV_OUTPUT" ]
then
  usage
fi

if [ "$ARGV_ARCHITECTURE" == "x64"  ]; then
  APPIMAGES_ARCHITECTURE="x86_64"
  APPIMAGEASSISTANT_CHECKSUM=e792fa6ba1dd81de6438844fde39aa12d6b6d15238154ec46baf01da1c92d59f
elif [ "$ARGV_ARCHITECTURE" == "x86"  ]; then
  APPIMAGES_ARCHITECTURE="i686"
  APPIMAGEASSISTANT_CHECKSUM=0faade0c009e703c221650e414f3b4ea8d03abbd8b9f1f065aef46156ee15dd0
else
  echo "Invalid architecture: $ARGV_ARCHITECTURE" 1>&2
  exit 1
fi

APPIMAGES_TAG=6
APPIMAGES_GITHUB_RELEASE_BASE_URL=https://github.com/probonopd/AppImageKit/releases/download/$APPIMAGES_TAG
APPIMAGEASSISTANT_PATH=$ARGV_DOWNLOAD_DIRECTORY/AppImageAssistant-$ARGV_ARCHITECTURE.AppImage
mkdir -p "$ARGV_DOWNLOAD_DIRECTORY"
./scripts/build/download-tool.sh -x \
  -u "$APPIMAGES_GITHUB_RELEASE_BASE_URL/AppImageAssistant_$APPIMAGES_TAG-$APPIMAGES_ARCHITECTURE.AppImage" \
  -c "$APPIMAGEASSISTANT_CHECKSUM" \
  -o "$APPIMAGEASSISTANT_PATH"

# Generate AppImage
mkdir -p "$(dirname "$ARGV_OUTPUT")"
$APPIMAGEASSISTANT_PATH "$ARGV_APPDIR" "$ARGV_OUTPUT"
