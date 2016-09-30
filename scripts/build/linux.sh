#!/bin/bash

###
# Copyright 2016 Resin.io
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

if ! command -v bower 2>/dev/null; then
  echo "Dependency missing: bower" 1>&2
  exit 1
fi

if ! command -v upx 2>/dev/null; then
  echo "Dependency missing: upx" 1>&2
  exit 1
fi

if ! command -v python 2>/dev/null; then
  echo "Dependency missing: python" 1>&2
  exit 1
fi

if [ "$#" -ne 2 ]; then
  echo "Usage: $0 <command> <arch>" 1>&2
  exit 1
fi

COMMAND=$1
if [ "$COMMAND" != "install" ] && [ "$COMMAND" != "package" ] && [ "$COMMAND" != "appimage" ] && [ "$COMMAND" != "all" ]; then
  echo "Unknown command: $COMMAND" 1>&2
  exit 1
fi

ARCH=$2
if [ "$ARCH" != "x64" ] && [ "$ARCH" != "x86" ]; then
  echo "Unknown architecture: $ARCH" 1>&2
  exit 1
fi

ELECTRON_PACKAGER=./node_modules/.bin/electron-packager
ELECTRON_VERSION=`node -e "console.log(require('./package.json').devDependencies['electron-prebuilt'])"`
APPLICATION_NAME=`node -e "console.log(require('./package.json').displayName)"`
APPLICATION_COPYRIGHT=`node -e "console.log(require('./package.json').copyright)"`
APPLICATION_VERSION=`node -e "console.log(require('./package.json').version)"`

function install {

  # Can be either "x64" or "ia32"
  architecture=$1

  # Ensure native addons are compiled with the correct headers
  # See https://github.com/electron/electron/blob/master/docs/tutorial/using-native-node-modules.md
  export npm_config_disturl=https://atom.io/download/atom-shell
  export npm_config_target=$ELECTRON_VERSION
  export npm_config_arch=$architecture
  export npm_config_runtime=electron

  rm -rf node_modules bower_components
  npm install --build-from-source
  bower install --production
}

function package_x86 {
  output_directory=$1
  output_package=$output_directory/Etcher-linux-x86

  $ELECTRON_PACKAGER . $APPLICATION_NAME \
    --platform=linux \
    --arch=ia32 \
    --version=$ELECTRON_VERSION \
    --ignore="`node scripts/packageignore.js`" \
    --asar \
    --app-version="$APPLICATION_VERSION" \
    --build-version="$APPLICATION_VERSION" \
    --overwrite \
    --out=$output_directory

  # Change ia32 suffix to x86 for consistency
  mv $output_directory/Etcher-linux-ia32 $output_package

  mv $output_package/Etcher $output_package/etcher
  chmod a+x $output_package/*.so*
}

function package_x64 {
  output_directory=$1
  output_package=$output_directory/Etcher-linux-x64

  $ELECTRON_PACKAGER . $APPLICATION_NAME \
    --platform=linux \
    --arch=x64 \
    --version=$ELECTRON_VERSION \
    --ignore="`node scripts/packageignore.js`" \
    --asar \
    --app-version="$APPLICATION_VERSION" \
    --build-version="$APPLICATION_VERSION" \
    --overwrite \
    --out=$output_directory

  mv $output_package/Etcher $output_package/etcher
  chmod a+x $output_package/*.so*
}

function app_dir_create {
  source_directory=$1
  architecture=$2
  output_directory=$3

  mkdir -p $output_directory/usr/bin
  cp ./scripts/build/AppImages/AppRun-$architecture $output_directory/AppRun
  cp ./scripts/build/AppImages/Etcher.desktop $output_directory
  cp ./assets/icon.png $output_directory
  cp -rf $source_directory/* $output_directory/usr/bin
  cp ./scripts/build/AppImages/desktopintegration $output_directory/usr/bin/etcher.wrapper
}

function installer {
  source_directory=$1
  architecture=$2
  output_directory=$3
  appdir_temporary_location=$output_directory/Etcher-linux-$architecture.AppDir
  output_file=$output_directory/Etcher-linux-$architecture.AppImage

  mkdir -p $output_directory
  app_dir_create $source_directory $architecture $appdir_temporary_location
  rm -f $output_file
  ./scripts/build/AppImages/AppImageAssistant-$architecture $appdir_temporary_location $output_file
  rm -rf $appdir_temporary_location
}

if [ "$COMMAND" == "install" ] || [ "$COMMAND" == "all" ]; then
  if [ "$ARCH" == "x86" ]; then
    install ia32
  fi

  if [ "$ARCH" == "x64" ]; then
    install x64
  fi
fi

if [ "$COMMAND" == "package" ] || [ "$COMMAND" == "all" ]; then
  if [ "$ARCH" == "x86" ]; then
    package_x86 etcher-release
  fi

  if [ "$ARCH" == "x64" ]; then
    package_x64 etcher-release
  fi
fi

if [ "$COMMAND" == "appimage" ] || [ "$COMMAND" == "all" ]; then
  if [ "$ARCH" == "x86" ]; then
    # UPX fails for some reason with some other so libraries
    # other than libnode.so in the x86 build
    upx -9 $output_package/etcher $output_package/libnode.so
  fi

  if [ "$ARCH" == "x64" ]; then
    upx -9 $output_package/etcher $output_package/*.so*
  fi

  installer etcher-release/Etcher-linux-$ARCH $ARCH etcher-release/installers
fi
