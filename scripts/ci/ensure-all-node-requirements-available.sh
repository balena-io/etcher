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

HERE="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

"$HERE/../build/check-dependency.sh" jq
"$HERE/../build/check-dependency.sh" git

PACKAGE_JSON=package.json

# builtin-modules.json from https://github.com/sindresorhus/builtin-modules
#NODE_MODULES=($(jq -r '.[]' "$HERE/builtin-modules.json"))
# workaround for path-length bug in jq that only affects Windows https://github.com/stedolan/jq/issues/1155
NODE_MODULES=($(cat "$HERE/builtin-modules.json" | jq -r '.[]'))
NPM_MODULES=($(jq -r '.dependencies | keys | .[]' "$PACKAGE_JSON"))
NPM_OPTIONAL_MODULES=($(jq -r '.optionalDependencies // {} | keys | .[]' "$PACKAGE_JSON"))
NPM_DEV_MODULES=($(jq -r '.devDependencies | keys | .[]' "$PACKAGE_JSON"))

DEV_FILES_REGEX=^\(tests\|scripts\)/
# need to do a non-greedy match, which is why we're not using (.*)
REQUIRE_REGEX=require\\\(\'\([-_/\.a-z0-9]+\)\'\\\)
JS_OR_JSON_REGEX=\.js\(on\)?$

# Check all js files stored in the repo can require() the packages they need
git ls-tree -r HEAD | while IFS='' read line; do
  if [[ "$(echo $line | cut -d ' ' -f 2)" == "blob" ]]; then
    # the cut delimiter in the line below is actually a tab character, not a space
    fullpath=$(echo "$line" | cut -d '	' -f 2)
    filename=$(basename $fullpath)
    extension=${filename##*.}
    if [[ "$extension" == "js" ]]; then
      # 'grep -v' to filter out any comment-blocks
      grep 'require(' "$fullpath" | grep -v "^ \* " | while IFS='' read line; do
        if [[ "$line" =~ $REQUIRE_REGEX ]]; then
          required=${BASH_REMATCH[1]}
        fi
        requirement_found=0
        is_local=0
        if [[ "$required" =~ "/" ]]; then
          if [[ "$required" =~ ^\.\.?/ ]]; then
            is_local=1
            localpath="$(dirname "$fullpath")/$required"
            if [[ "$localpath" =~ $JS_OR_JSON_REGEX ]] && [[ -f "$localpath" ]]; then
              requirement_found=1
            elif [[ -f "$localpath.js" ]] || [[ -f "$localpath/index.js" ]]; then
              requirement_found=1
            fi
          else
            required=${required%%/*}
          fi
        fi
        if [[ $is_local -eq 0 ]]; then
          # electron is implictly available
          if [[ "$required" == "electron" ]]; then
              requirement_found=1
          fi
          # Check builtin modules
          if [[ $requirement_found -eq 0 ]]; then
            for module in "${NODE_MODULES[@]}"; do
              if [[ "$required" == "$module" ]]; then
                requirement_found=1
                break
              fi
            done
          fi
          # Check dependencies from package.json
          if [[ $requirement_found -eq 0 ]]; then
            for module in "${NPM_MODULES[@]}"; do
              if [[ "$required" == "$module" ]]; then
                requirement_found=1
                break
              fi
            done
          fi
          # Check optionalDependencies from package.json
          if [[ $requirement_found -eq 0 ]] && [[ -n "${NPM_OPTIONAL_MODULES:-}" ]]; then
            for module in "${NPM_OPTIONAL_MODULES[@]}"; do
              if [[ "$required" == "$module" ]]; then
                requirement_found=1
                break
              fi
            done
          fi
          # Check devDependencies from package.json if it's in particular subdirectories
          if [[ $requirement_found -eq 0 ]] && [[ "$fullpath" =~ $DEV_FILES_REGEX ]]; then
            for module in "${NPM_DEV_MODULES[@]}"; do
              if [[ "$required" == "$module" ]]; then
                requirement_found=1
                break
              fi
            done
          fi
        fi
        if [[ $requirement_found -eq 0 ]]; then
          echo "$fullpath requires '$required' module which can't be located"
          exit 1
        fi
      done
      # see http://unix.stackexchange.com/a/213112
      err=$?
      if [[ $err -ne 0 ]]; then exit $err; fi
    fi
  fi
done

