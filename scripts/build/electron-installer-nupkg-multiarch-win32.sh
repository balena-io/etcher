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

./scripts/build/check-dependency.sh choco

function usage() {
  echo "Usage: $0"
  echo ""
  echo "Options"
  echo ""
  echo "    -i <application id>"
  echo "    -v <application version>"
  echo "    -d <nupkg directory>"
  echo "    -t <temporary directory>"
  echo "    -o <output>"
  exit 1
}

ARGV_ID=""
ARGV_VERSION=""
ARGV_DIRECTORY=""
ARGV_TEMPORARY_DIRECTORY=""
ARGV_OUTPUT=""

while getopts ":i:v:d:t:o:" option; do
  case $option in
    i) ARGV_ID="$OPTARG" ;;
    v) ARGV_VERSION="$OPTARG" ;;
    d) ARGV_DIRECTORY="$OPTARG" ;;
    t) ARGV_TEMPORARY_DIRECTORY="$OPTARG" ;;
    o) ARGV_OUTPUT="$OPTARG" ;;
    *) usage ;;
  esac
done

if [ -z "$ARGV_ID" ] ||
   [ -z "$ARGV_VERSION" ] ||
   [ -z "$ARGV_DIRECTORY" ] ||
   [ -z "$ARGV_TEMPORARY_DIRECTORY" ] ||
   [ -z "$ARGV_OUTPUT" ]; then
  usage
fi

choco pack "$ARGV_DIRECTORY/$ARGV_ID.nuspec" \
  --fail-on-error-output \
  --outputdirectory "$ARGV_TEMPORARY_DIRECTORY"

mv "$ARGV_TEMPORARY_DIRECTORY/$ARGV_ID.$ARGV_VERSION.nupkg" "$ARGV_OUTPUT"
