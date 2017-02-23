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

./scripts/build/check-dependency.sh browserify

function usage() {
  echo "Usage: $0"
  echo ""
  echo "Options"
  echo ""
  echo "    -e <entry point (.js)>"
  echo "    -o <output>"
  exit 1
}

ARGV_ENTRY_POINT=""
ARGV_OUTPUT=""

while getopts ":e:o:" option; do
  case $option in
    e) ARGV_ENTRY_POINT=$OPTARG ;;
    o) ARGV_OUTPUT=$OPTARG ;;
    *) usage ;;
  esac
done

if [ -z "$ARGV_ENTRY_POINT" ] || [ -z "$ARGV_OUTPUT" ]; then
  usage
fi

browserify "$ARGV_ENTRY_POINT" --node --outfile "$ARGV_OUTPUT"
