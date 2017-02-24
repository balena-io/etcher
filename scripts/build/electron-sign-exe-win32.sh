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

OS=$(uname -o 2>/dev/null || true)
if [[ "$OS" != "Msys" ]]; then
  echo "This script is only meant to be run in Windows" 1>&2
  exit 1
fi

./scripts/build/check-dependency.sh signtool

function usage() {
  echo "Usage: $0"
  echo ""
  echo "Options"
  echo ""
  echo "    -f <file (.exe)>"
  echo "    -c <certificate file (.p12)>"
  echo "    -p <certificate password>"
  echo "    -d <signature description>"
  exit 1
}

ARGV_FILE=""
ARGV_CERTIFICATE_FILE=""
ARGV_CERTIFICATE_PASSWORD=""
ARGV_SIGNATURE_DESCRIPTION=""

while getopts ":f:c:p:d:" option; do
  case $option in
    f) ARGV_FILE="$OPTARG" ;;
    c) ARGV_CERTIFICATE_FILE="$OPTARG" ;;
    p) ARGV_CERTIFICATE_PASSWORD="$OPTARG" ;;
    d) ARGV_SIGNATURE_DESCRIPTION="$OPTARG" ;;
    *) usage ;;
  esac
done

if [ -z "$ARGV_FILE" ] ||
   [ -z "$ARGV_CERTIFICATE_FILE" ] ||
   [ -z "$ARGV_CERTIFICATE_PASSWORD" ] ||
   [ -z "$ARGV_SIGNATURE_DESCRIPTION" ]
then
  usage
fi

TIMESTAMP_SERVER=http://timestamp.comodoca.com

signtool sign \
  -t "$TIMESTAMP_SERVER" \
  -d "$ARGV_SIGNATURE_DESCRIPTION" \
  -f "$ARGV_CERTIFICATE_FILE" \
  -p "$ARGV_CERTIFICATE_PASSWORD" \
  "$ARGV_FILE"

signtool verify -pa -v "$ARGV_FILE"
