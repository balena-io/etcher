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

# See http://www.davidpashley.com/articles/writing-robust-shell-scripts/
set -u
set -e
set -x

function check_dep() {
  if ! command -v $1 2>/dev/null 1>&2; then
    echo "Dependency missing: $1" 1>&2
    exit 1
  fi
}

OS=`uname`
if [[ "$OS" != "Linux" ]]; then
  echo "This script is only meant to be run in GNU/Linux" 1>&2
  exit 1
fi

if [ "$#" -ne 2 ]; then
  echo "Usage: $0 <command> <arch>" 1>&2
  exit 1
fi

COMMAND=$1
ARCH=$2
if [ "$ARCH" != "x64" ] &&
   [ "$ARCH" != "x86" ];
then
  echo "Unknown architecture: $ARCH" 1>&2
  exit 1
fi

ELECTRON_VERSION=`node -e "console.log(require('./package.json').devDependencies['electron-prebuilt'])"`
NODE_VERSION="6.2.2"
APPLICATION_NAME=`node -e "console.log(require('./package.json').displayName)"`
APPLICATION_DESCRIPTION=`node -e "console.log(require('./package.json').description)"`
APPLICATION_VERSION=`node -e "console.log(require('./package.json').version)"`

if [ "$COMMAND" == "develop-electron" ]; then
  ./scripts/unix/dependencies.sh \
    -r "$ARCH" \
    -v "$ELECTRON_VERSION" \
    -t electron
  exit 0
fi

if [ "$COMMAND" == "develop-cli" ]; then
  ./scripts/unix/dependencies.sh \
    -r "$ARCH" \
    -v "$NODE_VERSION" \
    -t node
  exit 0
fi

if [ "$COMMAND" == "installer-cli" ]; then
  ./scripts/unix/dependencies.sh -f -p \
    -r "$ARCH" \
    -v "$NODE_VERSION" \
    -t node

  ./scripts/unix/package-cli.sh \
    -n etcher \
    -e bin/etcher \
    -r x64 \
    -s linux \
    -o etcher-release/etcher-cli-linux-$ARCH
  exit 0
fi

if [ "$COMMAND" == "installer-debian" ]; then
  ./scripts/unix/dependencies.sh -p \
    -r "$ARCH" \
    -v "$ELECTRON_VERSION" \
    -t electron

  ./scripts/linux/package.sh \
    -n "$APPLICATION_NAME" \
    -r "$ARCH" \
    -v "$APPLICATION_VERSION" \
    -l LICENSE \
    -f "package.json,lib,node_modules,bower_components,build,assets" \
    -e "$ELECTRON_VERSION" \
    -o etcher-release/$APPLICATION_NAME-linux-$ARCH

  ./scripts/linux/installer-deb.sh \
    -p etcher-release/$APPLICATION_NAME-linux-$ARCH \
    -r "$ARCH" \
    -c scripts/build/debian/config.json \
    -o etcher-release/installers

  exit 0
fi

if [ "$COMMAND" == "installer-appimage" ]; then
  check_dep zip

  ./scripts/unix/dependencies.sh -p \
    -r "$ARCH" \
    -v "$ELECTRON_VERSION" \
    -t electron

  ./scripts/linux/package.sh \
    -n "$APPLICATION_NAME" \
    -r "$ARCH" \
    -v "$APPLICATION_VERSION" \
    -l LICENSE \
    -f "package.json,lib,node_modules,bower_components,build,assets" \
    -e "$ELECTRON_VERSION" \
    -o etcher-release/$APPLICATION_NAME-linux-$ARCH

  ./scripts/linux/installer-appimage.sh \
    -n "$APPLICATION_NAME" \
    -d "$APPLICATION_DESCRIPTION" \
    -p etcher-release/$APPLICATION_NAME-linux-$ARCH \
    -r $ARCH \
    -b etcher \
    -i assets/icon.png \
    -o etcher-release/$APPLICATION_NAME-linux-$ARCH.AppImage

  pushd etcher-release
  zip $APPLICATION_NAME-$APPLICATION_VERSION-linux-$ARCH.zip $APPLICATION_NAME-linux-$ARCH.AppImage
  mkdir -p installers
  mv $APPLICATION_NAME-$APPLICATION_VERSION-linux-$ARCH.zip installers
  popd

  exit 0
fi

echo "Unknown command: $COMMAND" 1>&2
exit 1
