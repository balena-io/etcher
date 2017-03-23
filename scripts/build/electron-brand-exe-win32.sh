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

function usage() {
  echo "Usage: $0"
  echo ""
  echo "Options"
  echo ""
  echo "    -f <file (.exe)>"
  echo "    -n <application name>"
  echo "    -d <application description>"
  echo "    -v <application version>"
  echo "    -c <application copyright>"
  echo "    -m <company name>"
  echo "    -i <application icon (.ico)>"
  echo "    -w <download directory>"
  exit 1
}

ARGV_FILE=""
ARGV_APPLICATION_NAME=""
ARGV_APPLICATION_DESCRIPTION=""
ARGV_VERSION=""
ARGV_COPYRIGHT=""
ARGV_COMPANY_NAME=""
ARGV_ICON=""
ARGV_DOWNLOAD_DIRECTORY=""

while getopts ":f:n:d:v:c:m:i:w:" option; do
  case $option in
    f) ARGV_FILE="$OPTARG" ;;
    n) ARGV_APPLICATION_NAME="$OPTARG" ;;
    d) ARGV_APPLICATION_DESCRIPTION="$OPTARG" ;;
    v) ARGV_VERSION="$OPTARG" ;;
    c) ARGV_COPYRIGHT="$OPTARG" ;;
    m) ARGV_COMPANY_NAME="$OPTARG" ;;
    i) ARGV_ICON="$OPTARG" ;;
    w) ARGV_DOWNLOAD_DIRECTORY="$OPTARG" ;;
    *) usage ;;
  esac
done

if [ -z "$ARGV_FILE" ] \
  || [ -z "$ARGV_APPLICATION_NAME" ] \
  || [ -z "$ARGV_APPLICATION_DESCRIPTION" ] \
  || [ -z "$ARGV_VERSION" ] \
  || [ -z "$ARGV_COPYRIGHT" ] \
  || [ -z "$ARGV_COMPANY_NAME" ] \
  || [ -z "$ARGV_ICON" ] \
  || [ -z "$ARGV_DOWNLOAD_DIRECTORY" ]
then
  usage
fi

RCEDIT_VERSION=v0.7.0
RCEDIT="$ARGV_DOWNLOAD_DIRECTORY/rcedit.exe"

./scripts/build/download-tool.sh -x \
  -u "https://github.com/electron/node-rcedit/raw/$RCEDIT_VERSION/bin/rcedit.exe" \
  -c "42649d92e1bbb3af1186fb0ad063df9fcdc18e7b5f2ea82191ecc8fdfaffb0d8" \
  -o "$RCEDIT"

"$RCEDIT" "$ARGV_FILE" \
  --set-version-string "FileDescription" "$ARGV_APPLICATION_NAME" \
  --set-version-string "InternalName" "$ARGV_APPLICATION_NAME" \
  --set-version-string "OriginalFilename" "$(basename "$ARGV_FILE")" \
  --set-version-string "ProductName" "$ARGV_APPLICATION_NAME - $ARGV_APPLICATION_DESCRIPTION" \
  --set-version-string "CompanyName" "$ARGV_COMPANY_NAME" \
  --set-version-string "LegalCopyright" "$ARGV_COPYRIGHT" \
  --set-file-version "$ARGV_VERSION" \
  --set-product-version "$ARGV_VERSION" \
  --set-icon "$ARGV_ICON"
