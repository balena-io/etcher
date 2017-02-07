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

./scripts/build/check-dependency.sh jq

function usage() {
  echo "Usage: $0"
  echo ""
  echo "Options"
  echo ""
  echo "    -s <source directory>"
  echo "    -v <application version>"
  echo "    -f <extra files (comma separated)>"
  echo "    -o <output>"
  exit 1
}

ARGV_SOURCE_DIRECTORY=""
ARGV_APPLICATION_VERSION=""
ARGV_FILES=""
ARGV_OUTPUT=""

while getopts ":s:v:f:o:" option; do
  case $option in
    s) ARGV_SOURCE_DIRECTORY=$OPTARG ;;
    v) ARGV_APPLICATION_VERSION=$OPTARG ;;
    f) ARGV_FILES=$OPTARG ;;
    o) ARGV_OUTPUT=$OPTARG ;;
    *) usage ;;
  esac
done

if [ -z "$ARGV_SOURCE_DIRECTORY" ] ||
   [ -z "$ARGV_APPLICATION_VERSION" ] || \
   [ -z "$ARGV_FILES" ] || \
   [ -z "$ARGV_OUTPUT" ]; then
  usage
fi

mkdir -p "$ARGV_OUTPUT"

jq ".version = \"$ARGV_APPLICATION_VERSION\"" "$ARGV_SOURCE_DIRECTORY/package.json" > "$ARGV_OUTPUT/package.json"

for file in $(echo "$ARGV_FILES" | sed "s/,/ /g"); do
  cp -rf "$file" "$ARGV_OUTPUT"
done
