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
if [ "$COMMAND" != "install" ] && [ "$COMMAND" != "package" ] && [ "$COMMAND" != "debian" ] && [ "$COMMAND" != "appimage" ] && [ "$COMMAND" != "cli" ] && [ "$COMMAND" != "all" ]; then
  echo "Unknown command: $COMMAND" 1>&2
  exit 1
fi

if [ "$COMMAND" == "appimage" ] || [ "$COMMAND" == "all" ]; then
  if ! command -v upx 2>/dev/null; then
    echo "Dependency missing: upx" 1>&2
    exit 1
  fi
fi

ARCH=$2
if [ "$ARCH" != "x64" ] && [ "$ARCH" != "x86" ]; then
  echo "Unknown architecture: $ARCH" 1>&2
  exit 1
fi

ELECTRON_VERSION=`node -e "console.log(require('./package.json').devDependencies['electron-prebuilt'])"`
APPLICATION_NAME=`node -e "console.log(require('./package.json').displayName)"`
APPLICATION_DESCRIPTION=`node -e "console.log(require('./package.json').description)"`
APPLICATION_VERSION=`node -e "console.log(require('./package.json').version)"`

if [ "$COMMAND" == "cli" ]; then
  ./scripts/unix/dependencies.sh -r "$ARCH" -v 6.2.2 -t node -f -p
  ./scripts/unix/package-cli.sh \
    -n etcher \
    -e bin/etcher \
    -r x64 \
    -s linux \
    -o etcher-release/etcher-cli-linux-$ARCH
  exit 0
fi

if [ "$COMMAND" == "install" ] || [ "$COMMAND" == "all" ]; then
  ./scripts/unix/dependencies.sh \
    -r "$ARCH" \
    -v "$ELECTRON_VERSION" \
    -t electron
fi

if [ "$COMMAND" == "package" ] || [ "$COMMAND" == "all" ]; then
  ./scripts/unix/dependencies.sh \
    -r "$ARCH" \
    -v "$ELECTRON_VERSION" \
    -t electron \
    -p

  ./scripts/linux/package.sh \
    -n "$APPLICATION_NAME" \
    -r "$ARCH" \
    -v "$APPLICATION_VERSION" \
    -l LICENSE \
    -f "package.json,lib,node_modules,bower_components,build,assets" \
    -e "$ELECTRON_VERSION" \
    -o etcher-release/$APPLICATION_NAME-linux-$ARCH
fi

if [ "$COMMAND" == "debian" ] || [ "$COMMAND" == "all" ]; then
  ./scripts/linux/installer-deb.sh \
    -p etcher-release/$APPLICATION_NAME-linux-$ARCH \
    -r "$ARCH" \
    -c scripts/build/debian/config.json \
    -o etcher-release/installers
fi

if [ "$COMMAND" == "appimage" ] || [ "$COMMAND" == "all" ]; then
  ./scripts/linux/installer-appimage.sh \
    -n "$APPLICATION_NAME" \
    -d "$APPLICATION_DESCRIPTION" \
    -p etcher-release/Etcher-linux-$ARCH \
    -r $ARCH \
    -b etcher \
    -i assets/icon.png \
    -o etcher-release/$APPLICATION_NAME-linux-$ARCH.AppImage

  pushd etcher-release
  zip Etcher-$APPLICATION_VERSION-linux-$ARCH.zip Etcher-linux-$ARCH.AppImage
  mkdir -p installers
  mv Etcher-$APPLICATION_VERSION-linux-$ARCH.zip installers
  popd
fi
