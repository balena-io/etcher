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
set -x

./scripts/build/check-dependency.sh zip

function usage() {
  echo "Usage: $0"
  echo ""
  echo "Options"
  echo ""
  echo "    -n <application name>"
  echo "    -a <application package directory>"
  echo "    -t <temporary directory>"
  echo "    -o <output>"
  exit 1
}

ARGV_APPLICATION_NAME=""
ARGV_APPLICATION=""
ARGV_TEMPORARY_DIRECTORY=""
ARGV_OUTPUT=""

while getopts ":n:a:t:o:" option; do
  case $option in
    n) ARGV_APPLICATION_NAME="$OPTARG" ;;
    a) ARGV_APPLICATION="$OPTARG" ;;
    t) ARGV_TEMPORARY_DIRECTORY="$OPTARG" ;;
    o) ARGV_OUTPUT="$OPTARG" ;;
    *) usage ;;
  esac
done

if [ -z "$ARGV_APPLICATION_NAME" ] ||
   [ -z "$ARGV_APPLICATION" ] ||
   [ -z "$ARGV_TEMPORARY_DIRECTORY" ] ||
   [ -z "$ARGV_OUTPUT" ]; then
  usage
fi

if [ ! -d "$PWD/node_modules" ]; then
  echo "Looks like you forgot to install the dependencies first!" 1>&2
  exit 1
fi

./node_modules/.bin/electron-builder "$ARGV_APPLICATION" \
  --platform=win \
  --out="$ARGV_TEMPORARY_DIRECTORY"

mv "$ARGV_TEMPORARY_DIRECTORY/$ARGV_APPLICATION_NAME Setup.exe" "$ARGV_OUTPUT"
