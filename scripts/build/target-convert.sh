#!/bin/bash

###
# Copyright 2017 resin.io
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

set -e
set -u

function usage() {
  echo "Usage: $0"
  echo ""
  echo "Options"
  echo ""
  echo "    -r <target>"
  echo "    -t <type (pkg)>"
  exit 1
}

ARGV_TARGET=""
ARGV_TYPE=""

while getopts ":r:t:" option; do
  case $option in
    r) ARGV_TARGET=$OPTARG ;;
    t) ARGV_TYPE=$OPTARG ;;
    *) usage ;;
  esac
done

if [ -z "$ARGV_TARGET" ] || [ -z "$ARGV_TYPE" ]; then
  usage
fi

RESULT=""

if [ "$ARGV_TYPE" == "pkg" ]; then
  if [ "$ARGV_TARGET" == "linux" ]; then
    RESULT=linux
  elif [ "$ARGV_TARGET" == "win32" ]; then
    RESULT=win
  elif [ "$ARGV_TARGET" == "darwin" ]; then
    RESULT=macos
  fi
else
  echo "Unsupported target type: $ARGV_TYPE" 1>&2
  exit 1
fi

if [ -z "$RESULT" ]; then
  echo "Unsupported target: $ARGV_TARGET" 1>&2
  exit 1
fi

echo "$RESULT"
