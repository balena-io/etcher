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

if ! command -v asar 2>/dev/null 1>&2; then
  echo "Dependency missing: asar" 1>&2
  exit 1
fi

function usage() {
  echo "Usage: $0"
  echo ""
  echo "Options"
  echo ""
  echo "    -f <files (comma separated)>"
  echo "    -o <output>"
  exit 0
}

ARGV_FILES=""
ARGV_OUTPUT=""

while getopts ":f:o:" option; do
  case $option in
    f) ARGV_FILES=$OPTARG ;;
    o) ARGV_OUTPUT=$OPTARG ;;
    *) usage ;;
  esac
done

if [ -z "$ARGV_FILES" ] || [ -z "$ARGV_OUTPUT" ]; then
  usage
fi

TEMPORAL_DIRECTORY="$ARGV_OUTPUT.tmp"
rm -rf "$TEMPORAL_DIRECTORY"
mkdir -p "$TEMPORAL_DIRECTORY"

for file in $(echo "$ARGV_FILES" | sed "s/,/ /g"); do
  cp -rf "$file" "$TEMPORAL_DIRECTORY"
done

mkdir -p $(dirname "$ARGV_OUTPUT")
asar pack "$TEMPORAL_DIRECTORY" "$ARGV_OUTPUT" --unpack *.node
rm -rf "$TEMPORAL_DIRECTORY"
