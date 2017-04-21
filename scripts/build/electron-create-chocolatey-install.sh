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
  echo "    -i <application id>"
  echo "    -u <application urls (comma separated) (x64,x86)>"
  echo "    -c <application checksums (comma separated) (x64,x86)>"
  echo "    -t <checksum type>"
  echo "    -o <output>"
  exit 1
}

ARGV_ID=""
ARGV_URLS=""
ARGV_CHECKSUMS=""
ARGV_CHECKSUM_TYPE=""
ARGV_OUTPUT=""

while getopts ":i:u:c:t:o:" option; do
  case $option in
    i) ARGV_ID="$OPTARG" ;;
    u) ARGV_URLS="$OPTARG" ;;
    c) ARGV_CHECKSUMS="$OPTARG" ;;
    t) ARGV_CHECKSUM_TYPE="$OPTARG" ;;
    o) ARGV_OUTPUT="$OPTARG" ;;
    *) usage ;;
  esac
done

if [ -z "$ARGV_ID" ] ||
   [ -z "$ARGV_URLS" ] ||
   [ -z "$ARGV_CHECKSUMS" ] ||
   [ -z "$ARGV_CHECKSUM_TYPE" ] ||
   [ -z "$ARGV_OUTPUT" ]; then
  usage
fi

IFS=',' read -a URLS <<< "$ARGV_URLS"
IFS=',' read -a CHECKSUMS <<< "$ARGV_CHECKSUMS"

URL_X64="${URLS[0]}"
URL_X86="${URLS[1]}"
CHECKSUM_X64="${CHECKSUMS[0]}"
CHECKSUM_X86="${CHECKSUMS[1]}"

cat << EOF > "$ARGV_OUTPUT"
\$ErrorActionPreference = 'Stop';
\$packageArgs = @{
    packageName = '$ARGV_ID'
    fileType = 'exe'
    url = '$URL_X86'
    url64 = '$URL_X64'
    silentArgs = "/S"
    checksum = '$CHECKSUM_X86'
    checksum64 = '$CHECKSUM_X64'
    checksumType = '$ARGV_CHECKSUM_TYPE'
}

Install-ChocolateyPackage @packageArgs
EOF
