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

if [ -z "$TRAVIS_OS_NAME" ]; then
  echo "This script is only meant to run in Travis CI" 1>&2
  exit 1
fi

if [[ "$TRAVIS_OS_NAME" == "linux" ]]; then
  ./scripts/build/docker/run-command.sh \
    -r "$TARGET_ARCH" \
    -s "$(pwd)" \
    -c 'make sanity-checks && xvfb-run --server-args=$XVFB_ARGS npm test'
else
  make sanity-checks
  npm test
fi
