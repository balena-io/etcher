#!/bin/bash

DEVICE=/dev/zram0
SIZE=1G

CURRENT_SIZE=$(zramctl --raw --noheadings --output DISKSIZE $DEVICE)

if [ $CURRENT_SIZE != $SIZE ]; then
	swapoff $DEVICE
	zramctl $DEVICE --algorithm lz4 --size $SIZE
	mkswap $DEVICE
	swapon $DEVICE
fi
