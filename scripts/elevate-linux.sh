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

set -e

binary=usr/bin/etcher

error() {
  if [ -x /usr/bin/zenity ] ; then
    LD_LIBRARY_PATH="" zenity --error --text "${1}" 2>/dev/null
  elif [ -x /usr/bin/kdialog ] ; then
    LD_LIBRARY_PATH="" kdialog --msgbox "${1}" 2>/dev/null
  elif [ -x /usr/bin/Xdialog ] ; then
    LD_LIBRARY_PATH="" Xdialog --msgbox "${1}" 2>/dev/null
  else
    echo "${1}"
  fi
  exit 1
}

# Check if we're running as root
if [ "$EUID" -eq 0 ]; then
  ./$binary
else

  # Determine a unique mountpoint based on the current mount point.
  mountpoint=$(mount | grep $(basename $APPIMAGE) | grep fuse | head -n 1 | awk '{ print $3 }')-elevated

  # We remount the AppImage to be able to workaround FUSE a
  # security measure of not allowing root to run binaries
  # from FUSE mounted filesystems.
  #
  # - The `ro` option is required, since otherwise `mount` will
  # refuse to mount the same AppImage in two different locations.
  #
  # - We don't want to go through the desktop integration helper
  # again, so we call the `etcher` binary directly.
  #
  # - We need to wait for a little bit for `umount` to be
  # successfull, otherwise it complains with an `EBUSY` error.
  runcommand="mkdir -p $mountpoint && mount -o loop -o ro $APPIMAGE $mountpoint && $mountpoint/$binary; sleep 1; umount $mountpoint"

  # We prefer gksudo since it gives a nicer looking dialog
  if command -v gksudo 2>/dev/null; then
    gksudo --preserve-env --description "Etcher" -- sh -c "$runcommand"
  elif command -v kdesudo 2>/dev/null; then
    kdesudo -d --comment "Etcher" -- sh -c "$runcommand"
  elif command -v pkexec 2>/dev/null; then

    # We need to inherit DISPLAY and XAUTHORITY, otherwise
    # pkexec will not know how to run X11 applications.
    # See http://askubuntu.com/a/332847
    pkexec env DISPLAY=$DISPLAY XAUTHORITY=$XAUTHORITY sh -c "$runcommand"

  else
    error "Please install gksudo, kdesudo, or pkexec to run this application."
  fi
fi

