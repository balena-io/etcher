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

check_dep wget
check_dep unzip

function usage() {
  echo "Usage: $0"
  echo ""
  echo "Options"
  echo ""
  echo "    -r <electron architecture>"
  echo "    -v <electron version>"
  echo "    -s <electron operating system>"
  echo "    -o <output directory>"
  exit 1
}

ARGV_ARCHITECTURE=""
ARGV_ELECTRON_VERSION=""
ARGV_OPERATING_SYSTEM=""
ARGV_OUTPUT=""

while getopts ":r:v:s:o:" option; do
  case $option in
    r) ARGV_ARCHITECTURE=$OPTARG ;;
    v) ARGV_ELECTRON_VERSION=$OPTARG ;;
    s) ARGV_OPERATING_SYSTEM=$OPTARG ;;
    o) ARGV_OUTPUT=$OPTARG ;;
    *) usage ;;
  esac
done

if [ -z "$ARGV_ARCHITECTURE" ] \
  || [ -z "$ARGV_ELECTRON_VERSION" ] \
  || [ -z "$ARGV_OPERATING_SYSTEM" ] \
  || [ -z "$ARGV_OUTPUT" ]
then
  usage
fi

OUTPUT_DIRNAME=$(dirname "$ARGV_OUTPUT")
rm -rf "$ARGV_OUTPUT"
mkdir -p "$OUTPUT_DIRNAME"

ELECTRON_ARCHITECTURE=$ARGV_ARCHITECTURE
if [ "$ELECTRON_ARCHITECTURE" == "x86" ]; then
  ELECTRON_ARCHITECTURE="ia32"
fi

ELECTRON_GITHUB_REPOSITORY=https://github.com/electron/electron
ELECTRON_FILENAME="electron-v$ARGV_ELECTRON_VERSION-$ARGV_OPERATING_SYSTEM-$ELECTRON_ARCHITECTURE.zip"

pushd "$OUTPUT_DIRNAME"
wget "$ELECTRON_GITHUB_REPOSITORY/releases/download/v$ARGV_ELECTRON_VERSION/$ELECTRON_FILENAME"
popd

unzip "$OUTPUT_DIRNAME/$ELECTRON_FILENAME" -d "$ARGV_OUTPUT"
rm "$OUTPUT_DIRNAME/$ELECTRON_FILENAME"
