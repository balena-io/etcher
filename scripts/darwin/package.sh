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

OS=$(uname)
if [[ "$OS" != "Darwin" ]]; then
  echo "This script is only meant to be run in OS X" 1>&2
  exit 1
fi

check_dep /usr/libexec/PlistBuddy

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
  echo "    -f <application files (comma separated)>"
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
ARGV_FILES=""
ARGV_ICON=""
ARGV_ELECTRON_VERSION=""
ARGV_OUTPUT=""

while getopts ":n:r:v:b:c:t:f:i:e:o:" option; do
  case $option in
    n) ARGV_APPLICATION_NAME="$OPTARG" ;;
    r) ARGV_ARCHITECTURE="$OPTARG" ;;
    v) ARGV_VERSION="$OPTARG" ;;
    b) ARGV_BUNDLE_ID="$OPTARG" ;;
    c) ARGV_COPYRIGHT="$OPTARG" ;;
    t) ARGV_CATEGORY="$OPTARG" ;;
    f) ARGV_FILES="$OPTARG" ;;
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
  || [ -z "$ARGV_FILES" ] \
  || [ -z "$ARGV_ICON" ] \
  || [ -z "$ARGV_ELECTRON_VERSION" ] \
  || [ -z "$ARGV_OUTPUT" ]
then
  usage
fi

./scripts/unix/download-electron.sh \
  -r "$ARGV_ARCHITECTURE" \
  -v "$ARGV_ELECTRON_VERSION" \
  -s darwin \
  -o "$ARGV_OUTPUT"

APPLICATION_OUTPUT="$ARGV_OUTPUT/$ARGV_APPLICATION_NAME.app"
mv "$ARGV_OUTPUT/Electron.app" "$APPLICATION_OUTPUT"
rm "$APPLICATION_OUTPUT/Contents/Resources/default_app.asar"

# Don't include these for now
rm -f "$ARGV_OUTPUT"/LICENSE*
rm -f "$ARGV_OUTPUT/version"

function plist_set() {
  local plist_file=$1
  local plist_key=$2
  local plist_value=$3

  /usr/libexec/PlistBuddy -c "Set $plist_key \"$plist_value\"" "$plist_file"
}

INFO_PLIST="$APPLICATION_OUTPUT/Contents/Info.plist"
plist_set "$INFO_PLIST" CFBundleName "$ARGV_APPLICATION_NAME"
plist_set "$INFO_PLIST" CFBundleDisplayName "$ARGV_APPLICATION_NAME"
plist_set "$INFO_PLIST" CFBundleIdentifier "$ARGV_BUNDLE_ID"
plist_set "$INFO_PLIST" CFBundleVersion "$ARGV_VERSION"
plist_set "$INFO_PLIST" CFBundleShortVersionString "$ARGV_VERSION"
plist_set "$INFO_PLIST" LSApplicationCategoryType "$ARGV_CATEGORY"

# Rename executable
plist_set "$INFO_PLIST" CFBundleExecutable "$ARGV_APPLICATION_NAME"
mv "$APPLICATION_OUTPUT/Contents/MacOS/Electron" "$APPLICATION_OUTPUT/Contents/MacOS/$ARGV_APPLICATION_NAME"

# Change application icon
ICON_FILENAME=$(echo "$ARGV_APPLICATION_NAME" | tr '[:upper:]' '[:lower:]').icns
plist_set "$INFO_PLIST" CFBundleIconFile "$ICON_FILENAME"
rm "$APPLICATION_OUTPUT/Contents/Resources/electron.icns"
cp "$ARGV_ICON" "$APPLICATION_OUTPUT/Contents/Resources/$ICON_FILENAME"

# Configure Electron Helper.app
HELPER_APP="$APPLICATION_OUTPUT/Contents/Frameworks/Electron Helper.app"
HELPER_INFO_PLIST="$HELPER_APP/Contents/Info.plist"
plist_set "$HELPER_INFO_PLIST" CFBundleIdentifier "$ARGV_BUNDLE_ID.helper"
plist_set "$HELPER_INFO_PLIST" CFBundleName "$ARGV_APPLICATION_NAME Helper"
mv "$HELPER_APP/Contents/MacOS/Electron Helper" "$HELPER_APP/Contents/MacOS/$ARGV_APPLICATION_NAME Helper"
mv "$HELPER_APP" "$APPLICATION_OUTPUT/Contents/Frameworks/$ARGV_APPLICATION_NAME Helper.app"

for id in EH NP; do
  HELPER_INFO_PLIST="$APPLICATION_OUTPUT/Contents/Frameworks/Electron Helper $id.app/Contents/Info.plist"
  plist_set "$HELPER_INFO_PLIST" CFBundleName "$ARGV_APPLICATION_NAME Helper $id"
  plist_set "$HELPER_INFO_PLIST" CFBundleDisplayName "$ARGV_APPLICATION_NAME Helper $id"
  plist_set "$HELPER_INFO_PLIST" CFBundleExecutable "$ARGV_APPLICATION_NAME Helper $id"
  plist_set "$HELPER_INFO_PLIST" CFBundleIdentifier "$ARGV_BUNDLE_ID.helper.$id"
  mv "$APPLICATION_OUTPUT/Contents/Frameworks/Electron Helper $id.app/Contents/MacOS/Electron Helper $id" \
    "$APPLICATION_OUTPUT/Contents/Frameworks/Electron Helper $id.app/Contents/MacOS/$ARGV_APPLICATION_NAME Helper $id"
  mv "$APPLICATION_OUTPUT/Contents/Frameworks/Electron Helper $id.app" \
    "$APPLICATION_OUTPUT/Contents/Frameworks/$ARGV_APPLICATION_NAME Helper $id.app"
done

./scripts/unix/create-asar.sh \
  -f "$ARGV_FILES" \
  -o "$APPLICATION_OUTPUT/Contents/Resources/app.asar"
