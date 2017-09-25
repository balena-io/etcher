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

set -e
set -u

function usage() {
  echo "Usage: $0"
  echo ""
  echo "Options"
  echo ""
  echo "    -r <architecture>"
  echo "    -t <type (debian|redhat|node|docker)>"
  exit 1
}

ARGV_ARCHITECTURE=""
ARGV_TYPE=""

while getopts ":r:t:" option; do
  case $option in
    r) ARGV_ARCHITECTURE=$OPTARG ;;
    t) ARGV_TYPE=$OPTARG ;;
    *) usage ;;
  esac
done

if [ -z "$ARGV_ARCHITECTURE" ] || [ -z "$ARGV_TYPE" ]; then
  usage
fi

RESULT=""

if [ "$ARGV_TYPE" == "node" ]; then
  if [ "$ARGV_ARCHITECTURE" == "x86" ]; then
    RESULT=ia32
  elif [ "$ARGV_ARCHITECTURE" == "x64" ]; then
    RESULT=x64
  elif [ "$ARGV_ARCHITECTURE" == "armv7hf" ]; then
    RESULT=arm
  fi
elif [ "$ARGV_TYPE" == "electron-builder" ]; then
  if [ "$ARGV_ARCHITECTURE" == "x86" ]; then
    RESULT=ia32
  elif [ "$ARGV_ARCHITECTURE" == "x64" ]; then
    RESULT=x64
  elif [ "$ARGV_ARCHITECTURE" == "armv7hf" ]; then
    RESULT=armv7l
  fi
elif [ "$ARGV_TYPE" == "debian" ]; then
  if [ "$ARGV_ARCHITECTURE" == "x86" ]; then
    RESULT=i386
  elif [ "$ARGV_ARCHITECTURE" == "x64" ]; then
    RESULT=amd64
  elif [ "$ARGV_ARCHITECTURE" == "armv7hf" ]; then
    RESULT=armhf
  fi
elif [ "$ARGV_TYPE" == "redhat" ]; then
  if [ "$ARGV_ARCHITECTURE" == "x86" ]; then
    RESULT=i686
  elif [ "$ARGV_ARCHITECTURE" == "x64" ]; then
    RESULT='x86_64'
  elif [ "$ARGV_ARCHITECTURE" == "armv7hf" ]; then
    RESULT=armhfp
  fi
elif [ "$ARGV_TYPE" == "appimage" ]; then
  if [ "$ARGV_ARCHITECTURE" == "x86" ]; then
    RESULT=i386
  elif [ "$ARGV_ARCHITECTURE" == "x64" ]; then
    RESULT='x86_64'
  elif [ "$ARGV_ARCHITECTURE" == "armv7hf" ]; then
    RESULT=armhf
  fi
elif [ "$ARGV_TYPE" == "docker" ]; then
  if [ "$ARGV_ARCHITECTURE" == "x64" ]; then
    RESULT=x86_64
  elif [ "$ARGV_ARCHITECTURE" == "x86" ]; then
    RESULT=i686
  elif [ "$ARGV_ARCHITECTURE" == "armv7hf" ]; then
    RESULT=armv7hf
  fi
else
  echo "Unsupported architecture type: $ARGV_TYPE" 1>&2
  exit 1
fi

if [ -z "$RESULT" ]; then
  echo "Unsupported architecture: $ARGV_ARCHITECTURE" 1>&2
  exit 1
fi

echo "$RESULT"
