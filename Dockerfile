FROM balenalib/aarch64-debian-node:12.16-buster-build as builder

RUN apt-get update
RUN apt-get install python libx11-dev libxss-dev libxss1

# Build clicklock
WORKDIR /usr/src/clicklock
RUN git clone https://github.com/zpfvo/clicklock.git .
RUN git checkout 5da48f70f90883f8a966f50f75e494e8f18adc95
RUN autoreconf --force --install
RUN ./configure
RUN make

WORKDIR /usr/src/app

ENV npm_config_disturl=https://electronjs.org/headers
ENV npm_config_runtime=electron
ENV npm_config_target=9.3.3

COPY scripts scripts
COPY typings typings
COPY tsconfig.json npm-shrinkwrap.json package.json ./

RUN npm i

COPY assets assets
COPY lib lib
COPY tsconfig.webpack.json webpack.config.ts electron-builder.yml afterPack.js ./

RUN npm run webpack
RUN PATH=$(pwd)/node_modules/.bin/:$PATH electron-builder --dir --config.asar=false --config.npmRebuild=false --config.nodeGypRebuild=false

FROM alexisresinio/aarch64-debian-bejs:latest
# clicklock
COPY --from=builder /usr/src/clicklock/clicklock /usr/bin/clicklock

# Etcher configuration script
COPY update-config-and-start.js /usr/src/app/

COPY --from=builder /usr/src/app/dist/linux-arm64-unpacked/resources/app /usr/src/app
COPY --from=builder /usr/src/app/node_modules/electron/ /usr/src/app/node_modules/electron
WORKDIR /usr/src/app/node_modules/.bin
RUN ln -s ../electron/cli.js electron
WORKDIR /usr/src/app

ENV ELECTRON_ENABLE_LOGGING=1
ENV UDEV=1

CMD node /usr/src/app/update-config-and-start.js
