#!/bin/bash

sleep 1
echo 0 > /sys/class/pwm/pwmchip0/export
sleep 1
cd /sys/class/pwm/pwmchip0/pwm0
echo 250000 > period
echo 125000 > duty_cycle
echo 1 > enable
sleep 1
echo 0 > enable
