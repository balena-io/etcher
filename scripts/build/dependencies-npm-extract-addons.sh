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

./scripts/build/check-dependency.sh rsync

function usage() {
  echo "Usage: $0"
  echo ""
  echo "Options"
  echo ""
  echo "    -d <node_modules directory>"
  echo "    -o <output directory>"
  exit 1
}

ARGV_NODE_MODULES=""
ARGV_OUTPUT_DIRECTORY=""

while getopts ":d:o:" option; do
  case $option in
    d) ARGV_NODE_MODULES=$OPTARG ;;
    o) ARGV_OUTPUT_DIRECTORY=$OPTARG ;;
    *) usage ;;
  esac
done

if [ -z "$ARGV_NODE_MODULES" ] || [ -z "$ARGV_OUTPUT_DIRECTORY" ]; then
  usage
fi

rsync \
  --archive \
  --prune-empty-dirs \
  --progress \
  --include='*.node' \
  --include='*.dll' \
  --include='*/' \
  --exclude='*' \
  "$ARGV_NODE_MODULES" "$ARGV_OUTPUT_DIRECTORY"

# rsync creates a `node_modules` directory
# inside the output directory
mv "$ARGV_OUTPUT_DIRECTORY"/node_modules/* "$ARGV_OUTPUT_DIRECTORY"
rmdir "$ARGV_OUTPUT_DIRECTORY/node_modules"
