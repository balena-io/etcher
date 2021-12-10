#!/bin/bash

Xvfb :99 -screen 0 1920x1080x24 -nolisten tcp &
pid=$!
echo $pid > /xvfd.pid

exec "$@"