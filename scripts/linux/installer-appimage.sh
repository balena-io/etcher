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

if ! command -v upx 2>/dev/null 1>&2; then
  echo "Dependency missing: upx" 1>&2
  exit 1
fi

if ! command -v wget 2>/dev/null 1>&2; then
  echo "Dependency missing: wget" 1>&2
  exit 1
fi

function usage() {
  echo "Usage: $0"
  echo ""
  echo "Options"
  echo ""
  echo "    -n <application name>"
  echo "    -d <application description>"
  echo "    -p <application package>"
  echo "    -r <application architecture>"
  echo "    -b <application binary name>"
  echo "    -i <application icon (.png)>"
  echo "    -o <output>"
  exit 0
}

ARGV_APPLICATION_NAME=""
ARGV_DESCRIPTION=""
ARGV_PACKAGE=""
ARGV_ARCHITECTURE=""
ARGV_BINARY=""
ARGV_ICON=""
ARGV_OUTPUT=""

while getopts ":n:d:p:r:b:i:o:" option; do
  case $option in
    n) ARGV_APPLICATION_NAME="$OPTARG" ;;
    d) ARGV_DESCRIPTION="$OPTARG" ;;
    p) ARGV_PACKAGE="$OPTARG" ;;
    r) ARGV_ARCHITECTURE="$OPTARG" ;;
    b) ARGV_BINARY="$OPTARG" ;;
    i) ARGV_ICON="$OPTARG" ;;
    o) ARGV_OUTPUT="$OPTARG" ;;
    *) usage ;;
  esac
done

if [ -z "$ARGV_APPLICATION_NAME" ] \
  || [ -z "$ARGV_DESCRIPTION" ] \
  || [ -z "$ARGV_PACKAGE" ] \
  || [ -z "$ARGV_ARCHITECTURE" ] \
  || [ -z "$ARGV_BINARY" ] \
  || [ -z "$ARGV_ICON" ] \
  || [ -z "$ARGV_OUTPUT" ]
then
  usage
fi

function download_executable() {
  local url=$1
  local output=$2
  wget "$url" -O "$output"
  chmod +x "$output"
}

APPIMAGES_TAG=6
APPIMAGES_GITHUB_RELEASE_BASE_URL=https://github.com/probonopd/AppImageKit/releases/download/$APPIMAGES_TAG

if [ "$ARGV_ARCHITECTURE" == "x64" ]; then
  APPIMAGES_ARCHITECTURE="x86_64"
elif [ "$ARGV_ARCHITECTURE" == "x86" ]; then
  APPIMAGES_ARCHITECTURE="i686"
else
  echo "Invalid architecture: $ARGV_ARCHITECTURE" 1>&2
  exit 1
fi

# Create AppDir
OUTPUT_FILENAME="$(basename "$ARGV_OUTPUT")"
APPDIR_PATH=/tmp/${OUTPUT_FILENAME%.*}.AppDir
APPDIR_ICON_FILENAME=icon
mkdir -p "$(dirname "$ARGV_OUTPUT")"
rm -rf "$APPDIR_PATH"
mkdir -p "$APPDIR_PATH/usr/bin"
download_executable \
  "$APPIMAGES_GITHUB_RELEASE_BASE_URL/AppRun_$APPIMAGES_TAG-$APPIMAGES_ARCHITECTURE" \
  "$APPDIR_PATH/AppRun"

cat >"$APPDIR_PATH/$ARGV_APPLICATION_NAME.desktop" <<EOF
[Desktop Entry]
Name=$ARGV_APPLICATION_NAME
Exec=$ARGV_BINARY.wrapper
Comment=$ARGV_DESCRIPTION
Icon=$APPDIR_ICON_FILENAME
Type=Application
EOF

cp "$ARGV_ICON" "$APPDIR_PATH/$APPDIR_ICON_FILENAME.png"
cp -rf "$ARGV_PACKAGE"/* "$APPDIR_PATH/usr/bin"
download_executable \
  "https://raw.githubusercontent.com/probonopd/AppImageKit/$APPIMAGES_TAG/desktopintegration" \
  "$APPDIR_PATH/usr/bin/$ARGV_BINARY.wrapper"

# Compress binaries
upx -9 "$APPDIR_PATH/usr/bin/$ARGV_BINARY"

# UPX fails for some reason with some other so libraries
# other than libnode.so in the x86 build
if [ "$ARGV_ARCHITECTURE" == "x86" ]; then
  upx -9 "$APPDIR_PATH"/usr/bin/libnode.so

else
  upx -9 "$APPDIR_PATH"/usr/bin/*.so*
fi

# Generate AppImage
rm -f "$ARGV_OUTPUT"

APPIMAGEASSISTANT_PATH=/tmp/AppImageAssistant.AppImage
download_executable \
  "$APPIMAGES_GITHUB_RELEASE_BASE_URL/AppImageAssistant_$APPIMAGES_TAG-$APPIMAGES_ARCHITECTURE.AppImage" \
  $APPIMAGEASSISTANT_PATH

$APPIMAGEASSISTANT_PATH "$APPDIR_PATH" "$ARGV_OUTPUT"
rm -rf "$APPDIR_PATH"
