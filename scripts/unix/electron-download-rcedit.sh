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

function check_dep() {
  if ! command -v $1 2>/dev/null 1>&2; then
    echo "Dependency missing: $1" 1>&2
    exit 1
  fi
}

check_dep wget
check_dep md5sum

function usage() {
  echo "Usage: $0"
  echo ""
  echo "Options"
  echo ""
  echo "    -o <output directory>"
  exit 1
}

ARGV_OUTPUT=""

while getopts ":o:" option; do
  case $option in
    o) ARGV_OUTPUT=$OPTARG ;;
    *) usage ;;
  esac
done

if [ -z "$ARGV_OUTPUT" ]; then
  usage
fi

RCEDIT_VERSION=v0.7.0
RCEDIT_REPOSITORY=https://github.com/electron/node-rcedit
RCEDIT_URL="$RCEDIT_REPOSITORY/raw/$RCEDIT_VERSION/bin/rcedit.exe"
RCEDIT_MD5=977014db025a0538e47b50d525c5a1c0

wget --no-check-certificate "$RCEDIT_URL" -O "$ARGV_OUTPUT"

if [ "$(md5sum $ARGV_OUTPUT)" != "$RCEDIT_MD5" ]; then
  echo "Checksum mismatch" 1>&2
  rm "$ARGV_OUTPUT"
  exit 1
fi
