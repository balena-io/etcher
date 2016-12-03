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

function check_dep() {
  if ! command -v $1 2>/dev/null 1>&2; then
    echo "Dependency missing: $1" 1>&2
    exit 1
  fi
}

check_dep curl

if [ "$#" -ne 1 ]; then
  echo "Usage: $0 <debfile>" 1>&2
  exit 1
fi

set +u
if [ -z "$BINTRAY_USER" ] || [ -z "$BINTRAY_API_KEY" ]; then
  echo "Please define the following environment variables:" 1>&2
  echo "" 1>&2
  echo "  BINTRAY_USER" 1>&2
  echo "  BINTRAY_API_KEY" 1>&2
  exit 1
fi
set -u

ARGV_FILE=$1
PACKAGE_COMPONENT=etcher
PACKAGE_DISTRIBUTION=stable
PACKAGE_FILE_NAME=$(basename $ARGV_FILE)
PACKAGE_NAME=${PACKAGE_FILE_NAME%.*}
PACKAGE_VERSION=$(echo $PACKAGE_NAME | cut -d_ -f2 | tr "~" "-")
PACKAGE_ARCH=$(echo $PACKAGE_NAME | cut -d_ -f3)

if [ -z $PACKAGE_VERSION ]; then
  echo "Couldn't infer the version from the package file name" 1>&2
  exit 1
fi

if [ -z $PACKAGE_ARCH ]; then
  echo "Couldn't infer the architecture from the package file name" 1>&2
  exit 1
fi

curl --upload-file $ARGV_FILE \
  --user $BINTRAY_USER:$BINTRAY_API_KEY \
  --header "X-Bintray-Debian-Distribution: $PACKAGE_DISTRIBUTION" \
  --header "X-Bintray-Debian-Component: $PACKAGE_COMPONENT" \
  --header "X-Bintray-Debian-Architecture: $PACKAGE_ARCH" \
  --header "X-Bintray-Publish: 1" \
  https://api.bintray.com/content/resin-io/debian/$PACKAGE_COMPONENT/$PACKAGE_VERSION/$PACKAGE_FILE_NAME

echo "$ARGV_FILE has been uploaded successfully"
