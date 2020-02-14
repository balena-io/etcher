#!/bin/bash

###
# Copyright 2017 balena.io
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

make sass

# From http://stackoverflow.com/a/9393642/1641422
if [[ -n $(git status -s | grep "\\.css$" || true) ]]; then
  echo "There are unstaged sass changes. Please commit the result of:" 1>&2
  echo ""
  echo "    make sass" 1>&2
  echo ""
  exit 1
fi
