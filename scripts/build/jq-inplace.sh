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
  echo "    -c <command>"
  echo "    -f <file>"
  echo "    -t <temporary directory>"
  exit 1
}

ARGV_COMMAND=""
ARGV_FILE=""
ARGV_TEMPORARY_DIRECTORY=""

while getopts ":c:f:t:" option; do
  case $option in
    c) ARGV_COMMAND=$OPTARG ;;
    f) ARGV_FILE=$OPTARG ;;
    t) ARGV_TEMPORARY_DIRECTORY="$OPTARG" ;;
    *) usage ;;
  esac
done

if [ -z "$ARGV_COMMAND" ] ||
   [ -z "$ARGV_FILE" ] ||
   [ -z "$ARGV_TEMPORARY_DIRECTORY" ]; then
  usage
fi

TEMPORARY_FILE="$ARGV_TEMPORARY_DIRECTORY/$(basename "$ARGV_FILE").TMP"
jq "$ARGV_COMMAND" "$ARGV_FILE" > "$TEMPORARY_FILE"
mv "$TEMPORARY_FILE" "$ARGV_FILE"
