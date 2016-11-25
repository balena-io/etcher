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

if ! command -v browserify 2>/dev/null 1>&2; then
  echo "Dependency missing: browserify" 1>&2
  exit 1
fi

if ! command -v wget 2>/dev/null 1>&2; then
  echo "Dependency missing: wget" 1>&2
  exit 1
fi

if ! command -v rsync 2>/dev/null 1>&2; then
  echo "Dependency missing: rsync" 1>&2
  exit 1
fi

function usage() {
  echo "Usage: $0"
  echo ""
  echo "Options"
  echo ""
  echo "    -n <application name>"
  echo "    -e <application entry point (.js)>"
  echo "    -r <architecture>"
  echo "    -s <operating system (linux|darwin)>"
  echo "    -o <output directory>"
  exit 0
}

ARGV_APPLICATION_NAME=""
ARGV_ENTRY_POINT=""
ARGV_ARCHITECTURE=""
ARGV_OPERATING_SYSTEM=""
ARGV_OUTPUT=""

while getopts ":n:e:r:s:o:" option; do
  case $option in
    n) ARGV_APPLICATION_NAME="$OPTARG" ;;
    e) ARGV_ENTRY_POINT="$OPTARG" ;;
    r) ARGV_ARCHITECTURE="$OPTARG" ;;
    s) ARGV_OPERATING_SYSTEM="$OPTARG" ;;
    o) ARGV_OUTPUT="$OPTARG" ;;
    *) usage ;;
  esac
done

if [ -z "$ARGV_APPLICATION_NAME" ] \
  || [ -z "$ARGV_ENTRY_POINT" ] \
  || [ -z "$ARGV_ARCHITECTURE" ] \
  || [ -z "$ARGV_OPERATING_SYSTEM" ] \
  || [ -z "$ARGV_OUTPUT" ]; then
  usage
fi

if [ ! -d "$PWD/node_modules" ]; then
  echo "Looks like you forgot to install the dependencies first!" 1>&2
  exit 1
fi

NODE_STATIC_ENTRY_POINT_REPOSITORY=https://github.com/resin-io-modules/node-static-entry-point
NODE_STATIC_ENTRY_POINT_VERSION=v1.0.0 # NodeJS v6
NODE_STATIC_ENTRY_POINT_FILENAME="node-$ARGV_OPERATING_SYSTEM-$ARGV_ARCHITECTURE"
NODE_STATIC_ENTRY_POINT_URL="$NODE_STATIC_ENTRY_POINT_REPOSITORY/releases/download/$NODE_STATIC_ENTRY_POINT_VERSION/$NODE_STATIC_ENTRY_POINT_FILENAME"

rm -rf "$ARGV_OUTPUT"
mkdir -p "$ARGV_OUTPUT"

browserify "$ARGV_ENTRY_POINT" --node --outfile "$ARGV_OUTPUT/index.js"
BINARY_LOCATION="$ARGV_OUTPUT/$ARGV_APPLICATION_NAME"
wget "$NODE_STATIC_ENTRY_POINT_URL" -O "$BINARY_LOCATION"
chmod +x "$BINARY_LOCATION"

rsync \
  --archive \
  --prune-empty-dirs \
  --progress \
  --include='*.node' \
  --include='*/' \
  --exclude='*' \
  node_modules \
  "$ARGV_OUTPUT/node_modules"
