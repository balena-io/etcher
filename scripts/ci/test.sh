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
  echo "    -o <operating system>"
  echo "    -r <architecture>"
  exit 1
}

ARGV_OPERATING_SYSTEM=""
ARGV_ARCHITECTURE=""

while getopts ":o:r:" option; do
  case $option in
    o) ARGV_OPERATING_SYSTEM=$OPTARG ;;
    r) ARGV_ARCHITECTURE=$OPTARG ;;
    *) usage ;;
  esac
done

if [ -z "$ARGV_OPERATING_SYSTEM" ] || [ -z "$ARGV_ARCHITECTURE" ]; then
  usage
fi

if [ "$ARGV_OPERATING_SYSTEM" == "linux" ]; then
  ./scripts/build/docker/run-command.sh \
    -r "$ARGV_ARCHITECTURE" \
    -s "$(pwd)" \
    -c 'xvfb-run --server-args=$XVFB_ARGS make lint test sanity-checks'
else
  ./scripts/build/check-dependency.sh make
  make lint test sanity-checks
fi
