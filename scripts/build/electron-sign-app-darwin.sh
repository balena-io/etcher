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
./scripts/build/check-dependency.sh spctl

function usage() {
  echo "Usage: $0"
  echo ""
  echo "Options"
  echo ""
  echo "    -a <application (.app)>"
  echo "    -i <identity>"
  exit 1
}

ARGV_APPLICATION=""
ARGV_IDENTITY=""

while getopts ":a:i:" option; do
  case $option in
    a) ARGV_APPLICATION="$OPTARG" ;;
    i) ARGV_IDENTITY="$OPTARG" ;;
    *) usage ;;
  esac
done

if [ -z "$ARGV_APPLICATION" ] || [ -z "$ARGV_IDENTITY" ]; then
  usage
fi

function sign_file() {
  local file=$1
  codesign --sign "$ARGV_IDENTITY" -fv "$file"
}

# Avoid issues with `for` loops on file names containing spaces
# See https://www.cyberciti.biz/tips/handling-filenames-with-spaces-in-bash.html
SAVEIFS=$IFS
IFS=$(echo -en "\n\b")

# Sign all executables
# See http://apple.stackexchange.com/a/116371
for file in $(find "$ARGV_APPLICATION" -perm +111 -type f); do
  sign_file "$file"
done

# Sign `.app` and `.framework` directories now that
# all the executables inside them have been signed.

for file in $(find "$ARGV_APPLICATION/Contents" -name '*.app'); do
  sign_file "$file"
done

for file in $(find "$ARGV_APPLICATION/Contents" -name '*.framework'); do
  sign_file "$file"
done

# Restore IFS
IFS=$SAVEIFS

# Sign top-level application after all
# its components have been signed
sign_file "$ARGV_APPLICATION"

# Verify signature
codesign \
  --verify \
  --deep \
  --display \
  --verbose=4 "$ARGV_APPLICATION"

spctl \
  --ignore-cache \
  --no-cache \
  --assess \
  --type execute \
  --verbose=4 "$ARGV_APPLICATION"
