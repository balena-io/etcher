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

function usage() {
  echo "Usage: $0"
  echo ""
  echo "Options"
  echo ""
  echo "    -d <dockerfile>"
  echo "    -s <source code directory>"
  echo "    -c <command>"
  exit 1
}

ARGV_DOCKERFILE=""
ARGV_SOURCE_CODE_DIRECTORY=""
ARGV_COMMAND=""

while getopts ":d:s:c:" option; do
  case $option in
    d) ARGV_DOCKERFILE=$OPTARG ;;
    s) ARGV_SOURCE_CODE_DIRECTORY=$OPTARG ;;
    c) ARGV_COMMAND=$OPTARG ;;
    *) usage ;;
  esac
done

if [ -z "$ARGV_DOCKERFILE" ] \
  || [ -z "$ARGV_SOURCE_CODE_DIRECTORY" ] \
  || [ -z "$ARGV_COMMAND" ]
then
  usage
fi

IMAGE_ID="etcher-build-$(basename "$ARGV_DOCKERFILE")"
docker build -f "$ARGV_DOCKERFILE" -t "$IMAGE_ID" "$ARGV_SOURCE_CODE_DIRECTORY"

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
for COPYVAR in AWS_ACCESS_KEY_ID AWS_SECRET_ACCESS_KEY ANALYTICS_SENTRY_TOKEN ANALYTICS_MIXPANEL_TOKEN CI; do
  eval "if [ ! -z \${$COPYVAR+x} ]; then DOCKER_ENVVARS+=(\"--env\" \"$COPYVAR=\$$COPYVAR\"); fi"
done

# The SYS_ADMIN capability and FUSE host device declarations
# are needed to be able to build an AppImage
# The `-t` and TERM setup is needed to display coloured output.
docker run -t \
  --env "TERM=xterm-256color" \
  ${DOCKER_ENVVARS[@]+"${DOCKER_ENVVARS[@]}"} \
  --privileged \
  --cap-add SYS_ADMIN \
  --device /dev/fuse:/dev/fuse:mrw \
  --volume "$ARGV_SOURCE_CODE_DIRECTORY:/etcher" \
  "$IMAGE_ID" /bin/bash -c "cd /etcher && $ARGV_COMMAND"
