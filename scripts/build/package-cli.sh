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

./scripts/build/check-dependency.sh browserify
./scripts/build/check-dependency.sh rsync

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
  exit 1
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

if [ "$ARGV_OPERATING_SYSTEM" == "darwin" ]; then
  NODE_STATIC_ENTRY_POINT_CHECKSUM=12509af741777a2c3688169272fbb01e66b5c0efae400a775770b71d7b62666c
elif [ "$ARGV_OPERATING_SYSTEM" == "linux" ]; then
  if [ "$ARGV_ARCHITECTURE" == "x64" ]; then
    NODE_STATIC_ENTRY_POINT_CHECKSUM=c1735694c1cef2bd26e4c8dcc7e67d5ad61b16b347f1b06588a52cf1aa4432fd
  fi
  if [ "$ARGV_ARCHITECTURE" == "x86" ]; then
    NODE_STATIC_ENTRY_POINT_CHECKSUM=49eeacc086df04bb3370b7c25afcf36b6e45083889ca438747ece3dd96602b8d
  fi
elif [ "$ARGV_OPERATING_SYSTEM" == "win32" ]; then
  if [ "$ARGV_ARCHITECTURE" == "x64" ]; then
    NODE_STATIC_ENTRY_POINT_CHECKSUM=60f167aa3389e86956c4ec3c44de7107b4dc9d634b26dbd5f08e14e85f32c2ea
  fi
  if [ "$ARGV_ARCHITECTURE" == "x86" ]; then
    NODE_STATIC_ENTRY_POINT_CHECKSUM=19f07b2d89a727dc64dd4b4e74b7ee8f4464ddc908b63bd60506d471e2f9f602
  fi
else
  echo "Unsupported operating system: $ARGV_OPERATING_SYSTEM" 1>&2
  exit 1
fi

browserify "$ARGV_ENTRY_POINT" --node --outfile "$ARGV_OUTPUT/index.js"
BINARY_LOCATION="$ARGV_OUTPUT/$ARGV_APPLICATION_NAME"
./scripts/build/download-tool.sh -x \
  -u "$NODE_STATIC_ENTRY_POINT_URL" \
  -c "$NODE_STATIC_ENTRY_POINT_CHECKSUM" \
  -o "$BINARY_LOCATION"

rsync \
  --archive \
  --prune-empty-dirs \
  --progress \
  --include='*.node' \
  --include='*/' \
  --exclude='*' \
  node_modules \
  "$ARGV_OUTPUT/node_modules"
