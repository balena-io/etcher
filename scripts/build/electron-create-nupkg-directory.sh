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
  echo "    -n <nuspec manifest>"
  echo "    -s <install script (.ps1)>"
  echo "    -o <output>"
  exit 1
}

ARGV_ID=""
ARGV_NUSPEC=""
ARGV_INSTALL_SCRIPT=""
ARGV_OUTPUT=""

while getopts ":i:n:s:o:" option; do
  case $option in
    i) ARGV_ID="$OPTARG" ;;
    n) ARGV_NUSPEC="$OPTARG" ;;
    s) ARGV_INSTALL_SCRIPT="$OPTARG" ;;
    o) ARGV_OUTPUT="$OPTARG" ;;
    *) usage ;;
  esac
done

if [ -z "$ARGV_ID" ] ||
   [ -z "$ARGV_NUSPEC" ] ||
   [ -z "$ARGV_INSTALL_SCRIPT" ] ||
   [ -z "$ARGV_OUTPUT" ]; then
  usage
fi

mkdir "$ARGV_OUTPUT"
cp "$ARGV_NUSPEC" "$ARGV_OUTPUT/$ARGV_ID.nuspec"
mkdir "$ARGV_OUTPUT/tools"
cp "$ARGV_INSTALL_SCRIPT" "$ARGV_OUTPUT/tools/chocolateyInstall.ps1"
