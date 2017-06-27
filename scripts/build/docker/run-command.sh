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

HERE="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

"$HERE/../check-dependency.sh" docker

function usage() {
  echo "Usage: $0"
  echo ""
  echo "Options"
  echo ""
  echo "    -r <architecture>"
  echo "    -s <source code directory>"
  echo "    -c <command>"
  exit 1
}

ARGV_ARCHITECTURE=""
ARGV_SOURCE_CODE_DIRECTORY=""
ARGV_COMMAND=""

while getopts ":r:s:c:" option; do
  case $option in
    r) ARGV_ARCHITECTURE=$OPTARG ;;
    s) ARGV_SOURCE_CODE_DIRECTORY=$OPTARG ;;
    c) ARGV_COMMAND=$OPTARG ;;
    *) usage ;;
  esac
done

if [ -z "$ARGV_ARCHITECTURE" ] \
  || [ -z "$ARGV_SOURCE_CODE_DIRECTORY" ] \
  || [ -z "$ARGV_COMMAND" ]
then
  usage
fi

if [ "$ARGV_ARCHITECTURE" == "x64" ]; then
  DOCKERFILE="$HERE/Dockerfile-x86_64"
elif [ "$ARGV_ARCHITECTURE" == "x86" ]; then
  DOCKERFILE="$HERE/Dockerfile-i686"
else
  echo "Unsupported architecture: $ARGV_ARCHITECTURE" 1>&2
  exit 1
fi

IMAGE_ID="etcher-build-$ARGV_ARCHITECTURE"

docker build -f "$DOCKERFILE" -t "$IMAGE_ID" "$ARGV_SOURCE_CODE_DIRECTORY"

# Docker complains with: ". includes invalid characters for a local
# volume name, only [a-zA-Z0-9][a-zA-Z0-9_.-] are allowed" otherwise
if [ "$ARGV_SOURCE_CODE_DIRECTORY" == "." ] ||
   [ "$ARGV_SOURCE_CODE_DIRECTORY" == "./" ]
then
  ARGV_SOURCE_CODE_DIRECTORY="$PWD"
fi

# Fairly ugly code that only passes environment variables into Docker when they're actually set
# see http://stackoverflow.com/a/13864829
# and http://mywiki.wooledge.org/BashFAQ/050
# and http://stackoverflow.com/a/7577209
DOCKER_ENVVARS=()
for COPYVAR in AWS_ACCESS_KEY_ID AWS_SECRET_ACCESS_KEY ANALYTICS_SENTRY_TOKEN ANALYTICS_MIXPANEL_TOKEN RELEASE_TYPE BINTRAY_USER BINTRAY_API_KEY CI PUBLISH GH_TOKEN; do
  eval "if [ ! -z \${$COPYVAR+x} ]; then DOCKER_ENVVARS+=(\"--env\" \"$COPYVAR=\$$COPYVAR\"); fi"
done

# The SYS_ADMIN capability and FUSE host device declarations
# are needed to be able to build an AppImage
# The `-t` and TERM setup is needed to display coloured output.
docker run -t \
  --env "TERM=xterm-256color" \
  --env "TARGET_ARCH=$ARGV_ARCHITECTURE" \
  ${DOCKER_ENVVARS[@]+"${DOCKER_ENVVARS[@]}"} \
  --privileged \
  --cap-add SYS_ADMIN \
  --device /dev/fuse:/dev/fuse:mrw \
  --volume "$ARGV_SOURCE_CODE_DIRECTORY:/etcher" \
  "$IMAGE_ID" /bin/bash -c "cd /etcher && $ARGV_COMMAND"
