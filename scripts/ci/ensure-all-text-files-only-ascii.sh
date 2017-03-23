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

"$HERE/../build/check-dependency.sh" git
"$HERE/../build/check-dependency.sh" perl

function contains_nonascii_characters() {
  # Strictly speaking ASCII is \x00-\x7F so the regex below could be /[\x80-\xFF]/
  # but that includes non-printable bytes we wouldn't normally expect
  # \x09 is \t, \x0A is \n, \x0D is \r
  ! perl -ne '/[^\x09\x0A\x0D\x20-\x7E]/ and exit(1)' "$1"
}

# Read list of text wildcards from .gitattributes
text_wildcards=()
while IFS='' read -r line || [[ -n "$line" ]]; do
  if [[ -n "$line" ]]; then
    if [[ ! "$line" =~ "^#" ]]; then
      filetype=$(echo "$line" | cut -d ' ' -f 2)
      if [[ "$filetype" == "text" ]]; then
        text_wildcards+=("$(echo "$line" | cut -d ' ' -f 1)")
      fi
    fi
  fi
done < .gitattributes

# Check all text files stored in the repo contain only ASCII
git ls-tree -r HEAD | while IFS='' read line; do
  if [[ "$(echo $line | cut -d ' ' -f 2)" == "blob" ]]; then
    # the cut delimiter in the line below is actually a tab character, not a space
    fullpath=$(echo "$line" | cut -d '	' -f 2)
    filename=$(basename $fullpath)
    for wildcard in "${text_wildcards[@]}"; do
      if [[ "$filename" = $wildcard ]]; then
        # lib/gui/css/main.css contains a UTF8 non-breaking space, which in turn comes
        # from node_modules/bootstrap-sass/assets/stylesheets/bootstrap/_breadcrumbs.scss
        if [[ "$fullpath" != "lib/gui/css/main.css" ]]; then
          if contains_nonascii_characters "$fullpath"; then
            echo "$fullpath contains non-ASCII characters"
            exit 1
          fi
        fi
        break
      fi
    done
  fi
done
