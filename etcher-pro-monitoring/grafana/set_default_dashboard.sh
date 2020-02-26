#!/bin/bash -x

GRAFANA_URL="127.0.0.1:$GF_SERVER_HTTP_PORT"

count=0
max_retries=10

while [[ $count -lt $max_retries ]]; do
    test_cmd=$(curl "http://$GRAFANA_URL/api/health" | jq -r -e .database)

    if [ "$test_cmd" != 'ok' ]; then
        count=$(( "$count" + 1 ))
        sleep 10
        continue
    fi
    if curl -sq -w "\n" -X PUT "http://$GRAFANA_URL/api/user/preferences" \
        -H 'Accept-Encoding: gzip, deflate, br' -H 'X-Grafana-Org-Id: 1' -H \
            'Content-Type: application/json;charset=UTF-8' -H \ 'Accept: application/json' --data-binary \
                '{"homeDashboardId":1,"theme":"","timezone":""}' --compressed; then
        break
    else
        count=$(( "$count" + 1 ))
        sleep 10
        continue
    fi
done
