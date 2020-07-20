#!/bin/bash

DEVICE=/dev/zram0

if [ ! -b $DEVICE ]; then
	modprobe zram
	zramctl $DEVICE --size 1024M
	mkswap $DEVICE
	swapon $DEVICE
fi
