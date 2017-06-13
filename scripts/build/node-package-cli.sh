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

function usage() {
  echo "Usage: $0"
  echo ""
  echo "Options"
  echo ""
  echo "    -n <application name>"
  echo "    -e <application entry point (.js)>"
  echo "    -l <node_modules directory>"
  echo "    -r <architecture>"
  echo "    -s <operating system (linux|darwin|win32)>"
  echo "    -o <output directory>"
  exit 1
}

ARGV_APPLICATION_NAME=""
ARGV_ENTRY_POINT=""
ARGV_NODE_MODULES=""
ARGV_ARCHITECTURE=""
ARGV_OPERATING_SYSTEM=""
ARGV_OUTPUT=""

while getopts ":n:e:l:r:s:o:" option; do
  case $option in
    n) ARGV_APPLICATION_NAME="$OPTARG" ;;
    e) ARGV_ENTRY_POINT="$OPTARG" ;;
    l) ARGV_NODE_MODULES="$OPTARG" ;;
    r) ARGV_ARCHITECTURE="$OPTARG" ;;
    s) ARGV_OPERATING_SYSTEM="$OPTARG" ;;
    o) ARGV_OUTPUT="$OPTARG" ;;
    *) usage ;;
  esac
done

if [ -z "$ARGV_APPLICATION_NAME" ] \
  || [ -z "$ARGV_ENTRY_POINT" ] \
  || [ -z "$ARGV_NODE_MODULES" ] \
  || [ -z "$ARGV_ARCHITECTURE" ] \
  || [ -z "$ARGV_OPERATING_SYSTEM" ] \
  || [ -z "$ARGV_OUTPUT" ]; then
  usage
fi

cp "$ARGV_ENTRY_POINT" "$ARGV_OUTPUT/index.js"

./scripts/build/dependencies-npm-extract-addons.sh \
  -d "$ARGV_NODE_MODULES" \
  -o "$ARGV_OUTPUT/node_modules"

APPLICATION_NAME_LOWERCASE="$(echo "$ARGV_APPLICATION_NAME" | tr '[:upper:]' '[:lower:]')"
BINARY_LOCATION="$ARGV_OUTPUT/$APPLICATION_NAME_LOWERCASE"
if [ "$ARGV_OPERATING_SYSTEM" == "win32" ]; then
  BINARY_LOCATION="$BINARY_LOCATION.exe"
fi

./scripts/build/node-static-entry-point-download.sh \
  -r "$ARGV_ARCHITECTURE" \
  -v "1.0.1" \
  -s "$ARGV_OPERATING_SYSTEM" \
  -o "$BINARY_LOCATION"
chmod +x "$BINARY_LOCATION"
