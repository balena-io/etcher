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

SHRINKWRAP_JSON=npm-shrinkwrap.json

# Two pair-wise arrays, because associative arrays only work in Bash 4
MODULE_NAMES=("dependencies[\"node-gyp\"]")
MODULE_VERSIONS=("3.5.0")

if [[ ${#MODULE_NAMES[@]} -ne ${#MODULE_VERSIONS[@]} ]]; then
    echo "Lengths of MODULE_NAMES and MODULE_VERSIONS arrays must match"
    exit 1
fi

for i in ${!MODULE_NAMES[@]}; do
    name=${MODULE_NAMES[$i]}
    version=${MODULE_VERSIONS[$i]}
    shrinkwrap_version=$(jq -r ".$name.version" "$SHRINKWRAP_JSON")
    if [[ "$version" != "$shrinkwrap_version" ]]; then
        echo "The following dependency must have the exact version in $SHRINKWRAP_JSON:"
        echo "    $name $version"
        exit 1
    fi
done
