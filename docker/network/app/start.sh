#!/usr/bin/env bash

# try to connect to google's dns for 3 seconds
nc -w 3 -z 8.8.8.8 53 > /dev/null 2>&1
online=$?
if [ $online -eq 0 ]; then
	echo "online check ok, skipping wifi-connect"
	while true; do sleep 999d; done
else
	echo "online check failed, spawning wifi-connect"
	export DBUS_SYSTEM_BUS_ADDRESS=unix:path=/host/run/dbus/system_bus_socket
	./wifi-connect -a 600 -u /usr/src/app/ui
	echo "wifi-connect exited"
fi
