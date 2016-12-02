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

function check_dep() {
  if ! command -v $1 2>/dev/null 1>&2; then
    echo "Dependency missing: $1" 1>&2
    exit 1
  fi
}

check_dep unzip

function usage() {
  echo "Usage: $0"
  echo ""
  echo "Options"
  echo ""
  echo "    -p <electron package>"
  echo "    -n <application name>"
  echo "    -v <application version>"
  echo "    -l <application license file>"
  echo "    -a <application asar (.asar)>"
  echo "    -o <output directory>"
  exit 1
}

ARGV_ELECTRON_PACKAGE=""
ARGV_APPLICATION_NAME=""
ARGV_VERSION=""
ARGV_LICENSE=""
ARGV_ASAR=""
ARGV_OUTPUT=""

while getopts ":p:n:v:l:a:o:" option; do
  case $option in
    p) ARGV_ELECTRON_PACKAGE="$OPTARG" ;;
    n) ARGV_APPLICATION_NAME="$OPTARG" ;;
    v) ARGV_VERSION="$OPTARG" ;;
    l) ARGV_LICENSE="$OPTARG" ;;
    a) ARGV_ASAR="$OPTARG" ;;
    o) ARGV_OUTPUT="$OPTARG" ;;
    *) usage ;;
  esac
done

if [ -z "$ARGV_ELECTRON_PACKAGE" ] \
  || [ -z "$ARGV_APPLICATION_NAME" ] \
  || [ -z "$ARGV_VERSION" ] \
  || [ -z "$ARGV_LICENSE" ] \
  || [ -z "$ARGV_ASAR" ] \
  || [ -z "$ARGV_OUTPUT" ]
then
  usage
fi

mkdir -p $(dirname "$ARGV_OUTPUT")
unzip "$ARGV_ELECTRON_PACKAGE" -d "$ARGV_OUTPUT"

mv $ARGV_OUTPUT/electron $ARGV_OUTPUT/$(echo "$ARGV_APPLICATION_NAME" | tr '[:upper:]' '[:lower:]')
cp $ARGV_LICENSE $ARGV_OUTPUT/LICENSE
echo "$ARGV_VERSION" > $ARGV_OUTPUT/version
rm $ARGV_OUTPUT/resources/default_app.asar

cp "$ARGV_ASAR" "$ARGV_OUTPUT/resources/app.asar"

if [ -d "$ARGV_ASAR.unpacked" ]; then
  cp -rf "$ARGV_ASAR.unpacked" "$ARGV_OUTPUT/resources/app.asar.unpacked"
fi
