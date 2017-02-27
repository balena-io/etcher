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
  echo "    -v <debian-friendly version>"
  echo "    -r <architecture>"
  echo "    -c <component name>"
  echo "    -t <release type (production|snapshot)>"
  exit 1
}

ARGV_FILE=""
ARGV_VERSION=""
ARGV_ARCHITECTURE=""
ARGV_COMPONENT_NAME=""
ARGV_RELEASE_TYPE=""

while getopts ":f:v:r:c:t:" option; do
  case $option in
    f) ARGV_FILE="$OPTARG" ;;
    v) ARGV_VERSION="$OPTARG" ;;
    r) ARGV_ARCHITECTURE="$OPTARG" ;;
    c) ARGV_COMPONENT_NAME="$OPTARG" ;;
    t) ARGV_RELEASE_TYPE="$OPTARG" ;;
    *) usage ;;
  esac
done

if [ -z "$ARGV_FILE" ] || \
   [ -z "$ARGV_VERSION" ] || \
   [ -z "$ARGV_ARCHITECTURE" ] || \
   [ -z "$ARGV_COMPONENT_NAME" ] || \
   [ -z "$ARGV_RELEASE_TYPE" ]
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

curl --upload-file $ARGV_FILE \
  --user $BINTRAY_USER:$BINTRAY_API_KEY \
  --header "X-Bintray-Debian-Distribution: $PACKAGE_DISTRIBUTION" \
  --header "X-Bintray-Debian-Component: $ARGV_COMPONENT_NAME" \
  --header "X-Bintray-Debian-Architecture: $ARGV_ARCHITECTURE" \
  --header "X-Bintray-Publish: 1" \
  https://api.bintray.com/content/resin-io/debian/$ARGV_COMPONENT_NAME/$ARGV_VERSION/$PACKAGE_FILE_NAME

echo "$ARGV_FILE has been uploaded successfully"
