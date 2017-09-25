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

./scripts/build/check-dependency.sh zip

function usage() {
  echo "Usage: $0"
  echo ""
  echo "Options"
  echo ""
  echo "    -f <file>"
  echo "    -s <operating system>"
  echo "    -o <output>"
  exit 1
}

ARGV_FILE=""
ARGV_OUTPUT=""

while getopts ":f:s:o:" option; do
  case $option in
    f) ARGV_FILE="$OPTARG" ;;
    s) ARGV_OPERATING_SYSTEM="$OPTARG" ;;
    o) ARGV_OUTPUT="$OPTARG" ;;
    *) usage ;;
  esac
done

if [ -z "$ARGV_FILE" ] ||
   [ -z "$ARGV_OPERATING_SYSTEM" ] ||
   [ -z "$ARGV_OUTPUT" ]; then
  usage
fi

CWD=$(pwd)

# The default unzip tool in Windows already creates a base directory
# whose name equals the zip file name excluding the extension, therefore
# the common practice for zipping directories in this platform is to
# zip their contents instead.
if [ "$ARGV_OPERATING_SYSTEM" == "win32" ] && [ -d "$ARGV_FILE" ]; then
  pushd "$ARGV_FILE"
  zip -r -9 "$CWD/$ARGV_OUTPUT" *

else
  pushd "$(dirname "$ARGV_FILE")"
  zip -r -9 "$CWD/$ARGV_OUTPUT" "$(basename "$ARGV_FILE")"
fi

popd

