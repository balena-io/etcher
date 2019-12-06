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

PACKAGE_JSON=package.json

# Two pair-wise arrays, because associative arrays only work in Bash 4
PRIMARY_VERSIONS=("dependencies[\"angular\"]")
SECONDARY_VERSIONS=("devDependencies[\"angular-mocks\"]")

function check_locked {
    name=$1
    version=$2
    if [[ "$version" =~ "^\^" ]]; then
        echo "Dependency: $name must be version-locked in $PACKAGE_JSON"
        exit 1
    fi
}

if [[ ${#PRIMARY_VERSIONS[@]} -ne ${#SECONDARY_VERSIONS[@]} ]]; then
    echo "Lengths of PRIMARY_VERSIONS and SECONDARY_VERSIONS arrays must match"
    exit 1
fi

for i in ${!PRIMARY_VERSIONS[@]}; do
    primary=${PRIMARY_VERSIONS[$i]}
    primary_version=$(jq -r ".$primary" "$PACKAGE_JSON")
    check_locked "$primary" "$primary_version"
    secondary=${SECONDARY_VERSIONS[$i]}
    secondary_version=$(jq -r ".$secondary" "$PACKAGE_JSON")
    check_locked "$secondary" "$secondary_version"
    if [[ "$primary_version" != "$secondary_version" ]]; then
        echo "The following dependencies must have the exact same version in $PACKAGE_JSON:"
        echo "    $primary"
        echo "    $secondary"
        exit 1
    fi
done
