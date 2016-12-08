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

OS=$(uname)
if [[ "$OS" != "Darwin" ]]; then
  echo "This script is only meant to be run in OS X" 1>&2
  exit 1
fi

./scripts/build/check-dependency.sh hdiutil
./scripts/build/check-dependency.sh xattr
./scripts/build/check-dependency.sh tiffutil
./scripts/build/check-dependency.sh osascript
./scripts/build/check-dependency.sh afsctool

function usage() {
  echo "Usage: $0"
  echo ""
  echo "Options"
  echo ""
  echo "    -n <application name>"
  echo "    -p <application package>"
  echo "    -i <application icon (.icns)>"
  echo "    -b <application background (.png)>"
  echo "    -o <output>"
  exit 1
}

ARGV_APPLICATION_NAME=""
ARGV_PACKAGE=""
ARGV_ICON=""
ARGV_BACKGROUND=""
ARGV_OUTPUT=""

while getopts ":n:p:i:b:o:" option; do
  case $option in
    n) ARGV_APPLICATION_NAME="$OPTARG" ;;
    p) ARGV_PACKAGE="$OPTARG" ;;
    i) ARGV_ICON="$OPTARG" ;;
    b) ARGV_BACKGROUND="$OPTARG" ;;
    o) ARGV_OUTPUT="$OPTARG" ;;
    *) usage ;;
  esac
done

if [ -z "$ARGV_APPLICATION_NAME" ] \
  || [ -z "$ARGV_PACKAGE" ] \
  || [ -z "$ARGV_ICON" ] \
  || [ -z "$ARGV_BACKGROUND" ] \
  || [ -z "$ARGV_OUTPUT" ]
then
  usage
fi

VOLUME_DIRECTORY=/Volumes/$ARGV_APPLICATION_NAME
VOLUME_APPLICATION=$VOLUME_DIRECTORY/$ARGV_APPLICATION_NAME.app

# Make sure any previous DMG was unmounted
hdiutil detach "$VOLUME_DIRECTORY" || true

# Create temporary read-write DMG image
hdiutil create \
  -srcfolder "$ARGV_PACKAGE" \
  -volname "$ARGV_APPLICATION_NAME" \
  -fs HFS+ \
  -fsargs "-c c=64,a=16,e=16" \
  -format UDRW \
  -size 600M "$ARGV_OUTPUT"

# Mount temporary DMG image, so we can modify it
hdiutil attach "$ARGV_OUTPUT" -readwrite -noverify

# Wait for a bit to ensure the image is mounted
sleep 2

# Link to /Applications within the DMG
pushd "$VOLUME_DIRECTORY"
ln -s /Applications
popd

# Set the DMG icon image
# Writing this hexadecimal buffer to the com.apple.FinderInfo
# extended attribute does the trick.
# See https://github.com/LinusU/node-appdmg/issues/14#issuecomment-29080500
cp "$ARGV_ICON" "$VOLUME_DIRECTORY/.VolumeIcon.icns"
xattr -wx com.apple.FinderInfo \
  "0000000000000000040000000000000000000000000000000000000000000000" "$VOLUME_DIRECTORY"

# Configure background image.
# We use tiffutil to create a "Multirepresentation Tiff file".
# This allows us to show the retina and non-retina image when appropriate.
mkdir "$VOLUME_DIRECTORY/.background"
BACKGROUND_RETINA=$(echo "$ARGV_BACKGROUND" | sed 's/\(.*\)\./\1@2x./')
tiffutil -cathidpicheck "$ARGV_BACKGROUND" "$BACKGROUND_RETINA" \
  -out "$VOLUME_DIRECTORY/.background/installer.tiff"

# This AppleScript performs the following tasks
# - Set the window basic properties.
# - Set the window size and position.
# - Set the icon size.
# - Arrange the icons.
echo '
   tell application "Finder"
     tell disk "'"${ARGV_APPLICATION_NAME}"'"
       open
       set current view of container window to icon view
       set toolbar visible of container window to false
       set statusbar visible of container window to false
       set the bounds of container window to {400, 100, 944, 530}
       set viewOptions to the icon view options of container window
       set arrangement of viewOptions to not arranged
       set icon size of viewOptions to 110
       set background picture of viewOptions to file ".background:installer.tiff"
       set position of item "'"${ARGV_APPLICATION_NAME}".app'" of container window to {140, 225}
       set position of item "Applications" of container window to {415, 225}
       close
       open
       update without registering applications
       delay 2
       close
     end tell
   end tell
' | osascript
sync

# Apply HFS+ compression
afsctool -ci -9 "$VOLUME_APPLICATION"

# Unmount temporary DMG image.
hdiutil detach "$VOLUME_DIRECTORY"
