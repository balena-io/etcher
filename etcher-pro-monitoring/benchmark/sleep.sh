#!/bin/sh

if [ ! -d /sys/class/gpio/gpio150 ]; then
	echo 150 > /sys/class/gpio/export;
	echo 1 > /sys/class/gpio/gpio150/value
else
	echo 1 > /sys/class/gpio/gpio150/value
fi

if [ ! -d /sys/class/gpio/gpio101 ]; then echo 101 > /sys/class/gpio/export; fi
if [ -d /sys/class/gpio/gpio101 ]; then echo 0 > /sys/class/gpio/gpio101/value; fi
if [ ! -d /sys/class/gpio/gpio131 ]; then echo 131 > /sys/class/gpio/export; fi
if [ -d /sys/class/gpio/gpio131 ]; then echo 1 > /sys/class/gpio/gpio131/value; fi
if [ -d /sys/class/pwm/pwmchip2/pwm0 ]; then echo 0 > /sys/class/pwm/pwmchip2/pwm0/enable; fi

#echo enabled > /sys/class/tty/ttymxc0/power/wakeup
echo freeze > /sys/power/state

if [ ! -d /sys/class/gpio/gpio150 ]; then
	echo 150 > /sys/class/gpio/export;
	echo 0 > /sys/class/gpio/gpio150/value
else
	echo 0 > /sys/class/gpio/gpio150/value
fi

if [ ! -d /sys/class/gpio/gpio101 ]; then echo 101 > /sys/class/gpio/export; fi
if [ -d /sys/class/gpio/gpio101 ]; then echo 1 > /sys/class/gpio/gpio101/value; fi
if [ ! -d /sys/class/gpio/gpio131 ]; then echo 131 > /sys/class/gpio/export; fi
if [ -d /sys/class/gpio/gpio131 ]; then echo 0 > /sys/class/gpio/gpio131/value; fi
if [ -d /sys/class/pwm/pwmchip2/pwm0 ]; then echo 1 > /sys/class/pwm/pwmchip2/pwm0/enable; fi
