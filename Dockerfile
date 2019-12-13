FROM balenalib/aarch64-debian-node:10-buster-build as builder

RUN apt-get update
RUN apt-get install python

WORKDIR /usr/src/app

ENV npm_config_disturl=https://electronjs.org/headers
ENV npm_config_runtime=electron
ENV npm_config_target=7.1.14

COPY src src
COPY scripts scripts
COPY typings typings
COPY binding.gyp tsconfig.json npm-shrinkwrap.json package.json ./

RUN npm i

COPY assets assets
COPY lib lib
COPY tsconfig.json webpack.config.ts ./

RUN npm run webpack

FROM alexisresinio/aarch64-debian-bejs:latest
COPY --from=builder /usr/src/app/node_modules /usr/src/app/node_modules
COPY --from=builder /usr/src/app/generated /usr/src/app/generated
COPY --from=builder /usr/src/app/assets /usr/src/app/assets
COPY --from=builder /usr/src/app/build /usr/src/app/build
COPY --from=builder /usr/src/app/lib /usr/src/app/lib
COPY --from=builder /usr/src/app/package.json /usr/src/app/package.json

ENV ELECTRON_ENABLE_LOGGING=1

ENV UDEV=1

RUN mkdir /tmp/media
ENV BALENA_ELECTRONJS_MOUNTS_ROOT=/tmp/media
ENV BALENA_ELECTRONJS_CONSTRAINT_PATH=/tmp/media

# Etcher configuration
COPY etcher-pro-config.json /root/.config/balena-etcher/config.json
