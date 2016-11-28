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
if [[ "$OS" != "Linux" ]]; then
  echo "This script is only meant to be run in GNU/Linux" 1>&2
  exit 1
fi

function usage() {
  echo "Usage: $0"
  echo ""
  echo "Options"
  echo ""
  echo "    -n <application name>"
  echo "    -r <application architecture>"
  echo "    -v <application version>"
  echo "    -l <application license file>"
  echo "    -f <application files (comma separated)>"
  echo "    -e <electron version>"
  echo "    -o <output>"
  exit 0
}

ARGV_APPLICATION_NAME=""
ARGV_ARCHITECTURE=""
ARGV_VERSION=""
ARGV_LICENSE=""
ARGV_FILES=""
ARGV_ELECTRON_VERSION=""
ARGV_OUTPUT=""

while getopts ":n:r:v:l:f:e:o:" option; do
  case $option in
    n) ARGV_APPLICATION_NAME="$OPTARG" ;;
    r) ARGV_ARCHITECTURE="$OPTARG" ;;
    v) ARGV_VERSION="$OPTARG" ;;
    l) ARGV_LICENSE="$OPTARG" ;;
    f) ARGV_FILES="$OPTARG" ;;
    e) ARGV_ELECTRON_VERSION="$OPTARG" ;;
    o) ARGV_OUTPUT="$OPTARG" ;;
    *) usage ;;
  esac
done

if [ -z "$ARGV_APPLICATION_NAME" ] \
  || [ -z "$ARGV_ARCHITECTURE" ] \
  || [ -z "$ARGV_VERSION" ] \
  || [ -z "$ARGV_LICENSE" ] \
  || [ -z "$ARGV_FILES" ] \
  || [ -z "$ARGV_ELECTRON_VERSION" ] \
  || [ -z "$ARGV_OUTPUT" ]
then
  usage
fi

./scripts/unix/download-electron.sh \
  -r "$ARGV_ARCHITECTURE" \
  -v "$ARGV_ELECTRON_VERSION" \
  -s linux \
  -o "$ARGV_OUTPUT"

mv $ARGV_OUTPUT/electron $ARGV_OUTPUT/$(echo "$ARGV_APPLICATION_NAME" | tr '[:upper:]' '[:lower:]')
cp $ARGV_LICENSE $ARGV_OUTPUT/LICENSE
echo "$ARGV_VERSION" > $ARGV_OUTPUT/version
rm $ARGV_OUTPUT/resources/default_app.asar

./scripts/unix/create-asar.sh \
  -f "$ARGV_FILES" \
  -o "$ARGV_OUTPUT/resources/app.asar"
