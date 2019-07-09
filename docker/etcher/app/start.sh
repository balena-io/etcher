#!/usr/bin/env bash

# By default docker gives us 64MB of shared memory size but to display heavy
# pages we need more.
umount /dev/shm && mount -t tmpfs shm /dev/shm

# Remove any lockfiles leftover by a hard reset or shutdown
rm /tmp/.X0-lock &>/dev/null || true
rm /tmp/resin/resin-updates.lock &>/dev/null || true

# Write Etcher config file from environment
node write-env-config.js

# Start automounting source drives
pushd /usr/src/automount
npm start &
popd

# while [[ true ]]; do
#   sleep 60
# done

# Start etcher
DBUS_SYSTEM_BUS_ADDRESS=unix:path=/host/run/dbus/system_bus_socket startx
