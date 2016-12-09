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
  echo "    -d <read-write application dmg>"
  echo "    -o <output>"
  exit 1
}

ARGV_APPLICATION_DMG=""
ARGV_OUTPUT=""

while getopts ":d:o:" option; do
  case $option in
    d) ARGV_APPLICATION_DMG="$OPTARG" ;;
    o) ARGV_OUTPUT="$OPTARG" ;;
    *) usage ;;
  esac
done

if [ -z "$ARGV_APPLICATION_DMG" ] || [ -z "$ARGV_OUTPUT" ]; then
  usage
fi

# Convert temporary DMG image into a production-ready
# compressed and read-only DMG image.
hdiutil convert "$ARGV_APPLICATION_DMG" \
  -format UDZO \
  -imagekey zlib-level=9 \
  -o "$ARGV_OUTPUT"
