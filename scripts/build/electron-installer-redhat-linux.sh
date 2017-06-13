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

set -u
set -e

OS=$(uname)
if [[ "$OS" != "Linux" ]]; then
  echo "This script is only meant to be run in GNU/Linux" 1>&2
  exit 1
fi

./scripts/build/check-dependency.sh electron-installer-redhat

# electron-installer-redhat is documented as requiring the rpmbuild commands
./scripts/build/check-dependency.sh rpmbuild

function usage() {
  echo "Usage: $0"
  echo ""
  echo "Options"
  echo ""
  echo "    -p <application directory>"
  echo "    -r <architecture>"
  echo "    -c <redhat configuration (.json)>"
  echo "    -o <output directory>"
  exit 1
}

ARGV_DIRECTORY=""
ARGV_ARCHITECTURE=""
ARGV_REDHAT_CONFIGURATION=""
ARGV_OUTPUT=""

while getopts ":p:r:c:o:" option; do
  case $option in
    p) ARGV_DIRECTORY="$OPTARG" ;;
    r) ARGV_ARCHITECTURE="$OPTARG" ;;
    c) ARGV_REDHAT_CONFIGURATION="$OPTARG" ;;
    o) ARGV_OUTPUT="$OPTARG" ;;
    *) usage ;;
  esac
done

if [ -z "$ARGV_DIRECTORY" ] \
  || [ -z "$ARGV_ARCHITECTURE" ] \
  || [ -z "$ARGV_REDHAT_CONFIGURATION" ] \
  || [ -z "$ARGV_OUTPUT" ]
then
  usage
fi

REDHAT_ARCHITECTURE=$(./scripts/build/architecture-convert.sh -r "$ARGV_ARCHITECTURE" -t redhat)

electron-installer-redhat \
  --src "$ARGV_DIRECTORY" \
  --dest "$ARGV_OUTPUT" \
  --config "$ARGV_REDHAT_CONFIGURATION" \
  --arch "$REDHAT_ARCHITECTURE"
