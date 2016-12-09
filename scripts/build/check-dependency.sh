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
set +u
ARGV_DEPENDENCIES=$*
set -u

if [ -z "$ARGV_DEPENDENCIES" ]; then
  echo "Usage: $0 <dependency...>"
  exit 1
fi

RESULT=""

for dependency in $ARGV_DEPENDENCIES; do
  if command -v $dependency 2>/dev/null 1>&2; then
    RESULT=$dependency
    break
  fi
done

if [ -z "$RESULT" ]; then
  echo "Dependency missing: $ARGV_DEPENDENCIES" 1>&2
  exit 1
fi

# Only print back if more than one command was passed
# otherwise if the script passes, its clear that the
# single command checked is the one that exists.
if [ "$#" -ne 1 ]; then
  echo $RESULT
fi
