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

./scripts/build/check-dependency.sh curl

function usage() {
  echo "Usage: $0"
  echo ""
  echo "Options"
  echo ""
  echo "    -f <file>"
  echo "    -v <version>"
  echo "    -r <architecture>"
  echo "    -o <bintray organization>"
  echo "    -p <bintray repository>"
  echo "    -c <bintray component>"
  echo "    -d <bintray distribution>"
  exit 1
}

ARGV_FILE=""
ARGV_VERSION=""
ARGV_ARCHITECTURE=""
ARGV_ORGANIZATION=""
ARGV_REPOSITORY=""
ARGV_COMPONENT=""
ARGV_DISTRIBUTION=""

while getopts ":f:v:r:o:p:c:d:" option; do
  case $option in
    f) ARGV_FILE="$OPTARG" ;;
    v) ARGV_VERSION="$OPTARG" ;;
    r) ARGV_ARCHITECTURE="$OPTARG" ;;
    o) ARGV_ORGANIZATION="$OPTARG" ;;
    p) ARGV_REPOSITORY="$OPTARG" ;;
    c) ARGV_COMPONENT="$OPTARG" ;;
    d) ARGV_DISTRIBUTION="$OPTARG" ;;
    *) usage ;;
  esac
done

if [ -z "$ARGV_FILE" ] || \
   [ -z "$ARGV_VERSION" ] || \
   [ -z "$ARGV_ARCHITECTURE" ] || \
   [ -z "$ARGV_ORGANIZATION" ] || \
   [ -z "$ARGV_REPOSITORY" ] || \
   [ -z "$ARGV_COMPONENT" ] || \
   [ -z "$ARGV_DISTRIBUTION" ]
then
  usage
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

PACKAGE_FILE_NAME=$(basename $ARGV_FILE)
PACKAGE_NAME=${PACKAGE_FILE_NAME%.*}
PACKAGE_ARCHITECTURE=$(./scripts/build/architecture-convert.sh -r "$ARGV_ARCHITECTURE" -t debian)

curl --upload-file $ARGV_FILE \
  --user $BINTRAY_USER:$BINTRAY_API_KEY \
  --header "X-Bintray-Debian-Distribution: $ARGV_DISTRIBUTION" \
  --header "X-Bintray-Debian-Component: $ARGV_COMPONENT" \
  --header "X-Bintray-Debian-Architecture: $PACKAGE_ARCHITECTURE" \
  --header "X-Bintray-Override: 1" \
  --header "X-Bintray-Publish: 1" \
  https://api.bintray.com/content/$ARGV_ORGANIZATION/$ARGV_REPOSITORY/$ARGV_COMPONENT/$ARGV_VERSION/$PACKAGE_FILE_NAME

echo "$ARGV_FILE has been uploaded successfully"
