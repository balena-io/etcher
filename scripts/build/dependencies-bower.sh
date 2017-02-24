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

./scripts/build/check-dependency.sh bower

function usage() {
  echo "Usage: $0"
  echo ""
  echo "Options"
  echo ""
  echo "    -x <install prefix>"
  echo "    -p production install"
  exit 1
}

ARGV_PREFIX=""
ARGV_PRODUCTION=false

while getopts ":x:p" option; do
  case $option in
    x) ARGV_PREFIX=$OPTARG ;;
    p) ARGV_PRODUCTION=true ;;
    *) usage ;;
  esac
done

INSTALL_OPTS="--allow-root"

if [ "$ARGV_PRODUCTION" == "true" ]; then
  INSTALL_OPTS="$INSTALL_OPTS --production"
fi

if [ -n "$ARGV_PREFIX" ]; then
  cp "$PWD/bower.json" "$ARGV_PREFIX/bower.json"
  pushd "$ARGV_PREFIX"
  bower install $INSTALL_OPTS
  popd
  rm "$ARGV_PREFIX/bower.json"
else
  bower install $INSTALL_OPTS
fi

