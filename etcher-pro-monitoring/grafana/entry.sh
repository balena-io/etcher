#!/bin/bash
/usr/src/app/set_default_dashboard.sh &
exec grafana-server -homepath /usr/share/grafana
