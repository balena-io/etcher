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

set -u
set -e

# Read list of wildcards from .gitattributes
wildcards=()
while IFS='' read -r line || [[ -n "$line" ]]; do
  if [[ -n "$line" ]]; then
    if [[ ! "$line" =~ "^#" ]]; then
      filetype=$(echo "$line" | cut -d ' ' -f 2)
      if [[ "$filetype" == "text" ]] || [[ "$filetype" == "binary" ]]; then
        wildcards+=("$(echo "$line" | cut -d ' ' -f 1)")
      fi
    fi
  fi
done < .gitattributes

# Verify those wildcards against all files stored in the repo
git ls-tree -r HEAD | while IFS='' read line; do
  if [[ "$(echo $line | cut -d ' ' -f 2)" == "blob" ]]; then
    # the cut delimiter in the line below is actually a tab character, not a space
    filename=$(basename $(echo "$line" | cut -d '	' -f 2))
    found_match=0
    for wildcard in "${wildcards[@]}"; do
      if [[ "$filename" = $wildcard ]]; then
        found_match=1
        break
      fi
    done
    if [[ $found_match -eq 0 ]]; then
      echo "No wildcards match $filename"
      exit 1
    fi
  fi
done
