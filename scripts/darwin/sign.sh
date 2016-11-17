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
  echo "    -a <application (.app)>"
  echo "    -i <identity>"
  exit 0
}

ARGV_APPLICATION=""
ARGV_IDENTITY=""

while getopts ":a:i:" option; do
  case $option in
    a) ARGV_APPLICATION="$OPTARG" ;;
    i) ARGV_IDENTITY="$OPTARG" ;;
    *) usage ;;
  esac
done

if [ -z "$ARGV_APPLICATION" ] || [ -z "$ARGV_IDENTITY" ]; then
  usage
fi

ELECTRON_OSX_SIGN=./node_modules/.bin/electron-osx-sign

if [ ! -x $ELECTRON_OSX_SIGN ]; then
  echo "Couldn't find $ELECTRON_OSX_SIGN" 1>&2
  echo "Have you installed the dependencies first?" 1>&2
  exit 1
fi

$ELECTRON_OSX_SIGN "$ARGV_APPLICATION" \
  --platform darwin \
  --verbose \
  --identity "$ARGV_IDENTITY"

codesign \
  --verify \
  --deep \
  --display \
  --verbose=4 "$ARGV_APPLICATION"

spctl \
  --ignore-cache \
  --no-cache \
  --assess \
  --type execute \
  --verbose=4 "$ARGV_APPLICATION"
