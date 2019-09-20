FROM balenalib/amd64-debian-node:12.6-buster-build as builder
RUN \
  apt-get update \
  && \
  apt-get install \
    build-essential \
    jq \
  && \
  apt-get clean
WORKDIR /usr/src/app
ADD . ./
RUN npm config set unsafe-perm true
RUN npm config set arch armv7l
ENV npm_config_arch=armv7l
RUN make electron-develop

FROM alexisresinio/balena-electronjs-amd64
WORKDIR /usr/src/app
COPY --from=builder /usr/src/app /usr/src/app
