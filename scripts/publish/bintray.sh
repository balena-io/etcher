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
  echo "    -t <release type (production|snapshot)>"
  echo "    -o <bintray organization>"
  echo "    -p <bintray repository>"
  echo "    -c <bintray component>"
  echo "    -y <project type (debian|redhat)>"
  exit 1
}

ARGV_FILE=""
ARGV_VERSION=""
ARGV_ARCHITECTURE=""
ARGV_RELEASE_TYPE=""
ARGV_ORGANIZATION=""
ARGV_REPOSITORY=""
ARGV_COMPONENT=""
ARGV_TYPE=""

while getopts ":f:v:r:t:o:p:c:y:" option; do
  case $option in
    f) ARGV_FILE="$OPTARG" ;;
    v) ARGV_VERSION="$OPTARG" ;;
    r) ARGV_ARCHITECTURE="$OPTARG" ;;
    t) ARGV_RELEASE_TYPE="$OPTARG" ;;
    o) ARGV_ORGANIZATION="$OPTARG" ;;
    p) ARGV_REPOSITORY="$OPTARG" ;;
    c) ARGV_COMPONENT="$OPTARG" ;;
    y) ARGV_TYPE="$OPTARG" ;;
    *) usage ;;
  esac
done

if [ -z "$ARGV_FILE" ] || \
   [ -z "$ARGV_VERSION" ] || \
   [ -z "$ARGV_ARCHITECTURE" ] || \
   [ -z "$ARGV_RELEASE_TYPE" ] || \
   [ -z "$ARGV_ORGANIZATION" ] || \
   [ -z "$ARGV_REPOSITORY" ] || \
   [ -z "$ARGV_COMPONENT" ] || \
   [ -z "$ARGV_TYPE" ]
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

if [ "$ARGV_RELEASE_TYPE" == "production" ]; then
  PACKAGE_DISTRIBUTION=stable
elif [ "$ARGV_RELEASE_TYPE" == "snapshot" ]; then
  PACKAGE_DISTRIBUTION=devel
else
  echo "Invalid release type: $ARGV_RELEASE_TYPE" 1>&2
  exit 1
fi

PACKAGE_FILE_NAME=$(basename $ARGV_FILE)
PACKAGE_NAME=${PACKAGE_FILE_NAME%.*}
PACKAGE_ARCHITECTURE=$(./scripts/build/architecture-convert.sh -r "$ARGV_ARCHITECTURE" -t "$ARGV_TYPE")

curl --upload-file $ARGV_FILE \
  --user $BINTRAY_USER:$BINTRAY_API_KEY \
  --header "X-Bintray-Override: 1" \
  --header "X-Bintray-Publish: 1" \
  --header "X-Bintray-Debian-Distribution: $PACKAGE_DISTRIBUTION" \
  --header "X-Bintray-Debian-Component: $ARGV_COMPONENT" \
  --header "X-Bintray-Debian-Architecture: $PACKAGE_ARCHITECTURE" \
  https://api.bintray.com/content/$ARGV_ORGANIZATION/$ARGV_REPOSITORY/$ARGV_COMPONENT/$ARGV_VERSION/$PACKAGE_FILE_NAME

echo "$ARGV_FILE has been uploaded successfully"
