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

./scripts/build/check-dependency.sh curl

SHA256SUM=$(./scripts/build/check-dependency.sh sha256sum "shasum -a 256")

function usage() {
  echo "Usage: $0"
  echo ""
  echo "Options"
  echo ""
  echo "    -u <url>"
  echo "    -c <sha256 checksum>"
  echo "    -x set execute permissions"
  echo "    -o <output>"
  exit 1
}

ARGV_URL=""
ARGV_CHECKSUM=""
ARGV_EXECUTE_PERMISSIONS=false
ARGV_OUTPUT=""

while getopts ":u:c:o:x" option; do
  case $option in
    u) ARGV_URL="$OPTARG" ;;
    c) ARGV_CHECKSUM="$OPTARG" ;;
    x) ARGV_EXECUTE_PERMISSIONS=true ;;
    o) ARGV_OUTPUT="$OPTARG" ;;
    *) usage ;;
  esac
done

if [ -z "$ARGV_URL" ] || \
   [ -z "$ARGV_CHECKSUM" ] || \
   [ -z "$ARGV_OUTPUT" ]
then
  usage
fi

function checksum_matches() {
  local file=$1
  local hash=$2
	test "$($SHA256SUM $file | cut -d ' ' -f1)" = "$hash"
}

TEMP_OUTPUT="$ARGV_OUTPUT.TMP"

if [ -f "$TEMP_OUTPUT" ]; then
  rm "$TEMP_OUTPUT"
fi

if [ -f "$ARGV_OUTPUT" ]; then
  if checksum_matches "$ARGV_OUTPUT" "$ARGV_CHECKSUM"; then
    echo "Re-using from cache"
    exit 0
  else
    rm "$ARGV_OUTPUT"
  fi
fi

echo "Downloading $ARGV_URL"
curl --continue-at - --retry 100 --location --output "$TEMP_OUTPUT" "$ARGV_URL"

if ! checksum_matches "$TEMP_OUTPUT" "$ARGV_CHECKSUM"; then
  echo "Checksum mismatch" 1>&2
  rm "$TEMP_OUTPUT"
  exit 1
else
  mv "$TEMP_OUTPUT" "$ARGV_OUTPUT"
fi

if [ "$ARGV_EXECUTE_PERMISSIONS" == "true" ]; then
  chmod +x "$ARGV_OUTPUT"
fi
