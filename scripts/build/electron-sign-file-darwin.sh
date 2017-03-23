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

./scripts/build/check-dependency.sh codesign

function usage() {
  echo "Usage: $0"
  echo ""
  echo "Options"
  echo ""
  echo "    -f <file>"
  echo "    -i <identity>"
  exit 1
}

ARGV_FILE=""
ARGV_IDENTITY=""

while getopts ":f:i:" option; do
  case $option in
    f) ARGV_FILE="$OPTARG" ;;
    i) ARGV_IDENTITY="$OPTARG" ;;
    *) usage ;;
  esac
done

if [ -z "$ARGV_FILE" ] || [ -z "$ARGV_IDENTITY" ]; then
  usage
fi

codesign --sign "$ARGV_IDENTITY" -fv "$ARGV_FILE"
codesign --verify --deep --display "$ARGV_FILE"
