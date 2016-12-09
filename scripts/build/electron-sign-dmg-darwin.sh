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

./scripts/build/check-dependency.sh hdiutil

function usage() {
  echo "Usage: $0"
  echo ""
  echo "Options"
  echo ""
  echo "    -n <application name>"
  echo "    -d <application (.dmg)>"
  echo "    -i <identity>"
  exit 1
}

ARGV_APPLICATION_NAME=""
ARGV_APPLICATION_DMG=""
ARGV_IDENTITY=""

while getopts ":n:d:i:" option; do
  case $option in
    n) ARGV_APPLICATION_NAME="$OPTARG" ;;
    d) ARGV_APPLICATION_DMG="$OPTARG" ;;
    i) ARGV_IDENTITY="$OPTARG" ;;
    *) usage ;;
  esac
done

if [ -z "$ARGV_APPLICATION_NAME" ] ||
   [ -z "$ARGV_APPLICATION_DMG" ] ||
   [ -z "$ARGV_IDENTITY" ]; then
  usage
fi

VOLUME_DIRECTORY=/Volumes/$ARGV_APPLICATION_NAME
VOLUME_APPLICATION=$VOLUME_DIRECTORY/$ARGV_APPLICATION_NAME.app

# Make sure any previous DMG was unmounted
hdiutil detach "$VOLUME_DIRECTORY" || true

# Mount temporary DMG image, so we can modify it
hdiutil attach "$ARGV_APPLICATION_DMG" -readwrite -noverify

# Wait for a bit to ensure the image is mounted
sleep 2

./scripts/build/electron-sign-app-darwin.sh -a "$VOLUME_APPLICATION" -i "$ARGV_IDENTITY"

# Unmount temporary DMG image.
hdiutil detach "$VOLUME_DIRECTORY"
