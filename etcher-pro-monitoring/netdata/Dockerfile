FROM netdata/netdata

WORKDIR /etc/netdata
COPY httpcheck-supervisor.yml ./go.d/httpcheck.conf
COPY balenad.conf ./python.d/dockerd.conf
