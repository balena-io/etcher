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
ENV npm_config_runtime=electron
ENV npm_config_disturl=https://electronjs.org/headers
ENV npm_config_target=6.0.10
ENV npm_config_build_from_source=true
ENV npm_config_unsafe_perm=true
ADD package.json npm-shrinkwrap.json binding.gyp ./
RUN npm install

# TODO: makefile only needed for sass
ADD Makefile webpack.config.js tsconfig.json ./
ADD lib ./lib
ADD typings ./typings
ADD assets ./assets
RUN npm run webpack
RUN make sass

FROM alexisresinio/balena-electronjs-amd64
# TODO: only elevator.target on the next line?
COPY --from=builder /usr/src/app/build/Release /usr/src/app/build/Release
COPY --from=builder /usr/src/app/lib/start.js /usr/src/app/lib/start.js
COPY --from=builder /usr/src/app/lib/gui/app/index.html /usr/src/app/lib/gui/app/index.html
COPY --from=builder /usr/src/app/lib/gui/css /usr/src/app/lib/gui/css
COPY --from=builder /usr/src/app/lib/gui/assets /usr/src/app/lib/gui/assets
COPY --from=builder /usr/src/app/lib/shared /usr/src/app/lib/shared
COPY --from=builder /usr/src/app/package.json /usr/src/app/package.json
COPY --from=builder /usr/src/app/generated /usr/src/app/generated
COPY --from=builder /usr/src/app/node_modules/electron /usr/src/app/node_modules/electron
# TODO: be more restrictive on lodash
#COPY --from=builder /usr/src/app/node_modules /usr/src/app/node_modules
# copy only native modules and their dependencies
COPY --from=builder /usr/src/app/node_modules/xxhash /usr/src/app/node_modules/xxhash
COPY --from=builder /usr/src/app/node_modules/lzma-native /usr/src/app/node_modules/lzma-native
COPY --from=builder /usr/src/app/node_modules/drivelist /usr/src/app/node_modules/drivelist
COPY --from=builder /usr/src/app/node_modules/electron /usr/src/app/node_modules/electron
COPY --from=builder /usr/src/app/node_modules/mountutils /usr/src/app/node_modules/mountutils
COPY --from=builder /usr/src/app/node_modules/ext2fs /usr/src/app/node_modules/ext2fs
COPY --from=builder /usr/src/app/node_modules/usb /usr/src/app/node_modules/usb
# used by drivelist
COPY --from=builder /usr/src/app/node_modules/bindings /usr/src/app/node_modules/bindings
COPY --from=builder /usr/src/app/node_modules/mz /usr/src/app/node_modules/mz
# used by mz/child_process
COPY --from=builder /usr/src/app/node_modules/thenify-all /usr/src/app/node_modules/thenify-all
# used my thenify-all
COPY --from=builder /usr/src/app/node_modules/thenify /usr/src/app/node_modules/thenify
# used my thenify
COPY --from=builder /usr/src/app/node_modules/any-promise /usr/src/app/node_modules/any-promise
# used by bindings
COPY --from=builder /usr/src/app/node_modules/file-uri-to-path /usr/src/app/node_modules/file-uri-to-path
# used by ext2fs
COPY --from=builder /usr/src/app/node_modules/bluebird /usr/src/app/node_modules/bluebird
# used by lzma-native
COPY --from=builder /usr/src/app/node_modules/readable-stream /usr/src/app/node_modules/readable-stream
COPY --from=builder /usr/src/app/node_modules/node-pre-gyp /usr/src/app/node_modules/node-pre-gyp
# used by readable-stream
COPY --from=builder /usr/src/app/node_modules/process-nextick-args /usr/src/app/node_modules/process-nextick-args
COPY --from=builder /usr/src/app/node_modules/isarray /usr/src/app/node_modules/isarray
COPY --from=builder /usr/src/app/node_modules/safe-buffer /usr/src/app/node_modules/safe-buffer
COPY --from=builder /usr/src/app/node_modules/core-util-is /usr/src/app/node_modules/core-util-is
COPY --from=builder /usr/src/app/node_modules/inherits /usr/src/app/node_modules/inherits
COPY --from=builder /usr/src/app/node_modules/util-deprecate /usr/src/app/node_modules/util-deprecate
# used by node-pre-gyp
COPY --from=builder /usr/src/app/node_modules/nopt /usr/src/app/node_modules/nopt
COPY --from=builder /usr/src/app/node_modules/npmlog /usr/src/app/node_modules/npmlog
COPY --from=builder /usr/src/app/node_modules/rimraf /usr/src/app/node_modules/rimraf
COPY --from=builder /usr/src/app/node_modules/semver /usr/src/app/node_modules/semver
COPY --from=builder /usr/src/app/node_modules/detect-libc /usr/src/app/node_modules/detect-libc
# used by rimraf
COPY --from=builder /usr/src/app/node_modules/glob /usr/src/app/node_modules/glob
# used by glob
COPY --from=builder /usr/src/app/node_modules/fs.realpath /usr/src/app/node_modules/fs.realpath
COPY --from=builder /usr/src/app/node_modules/minimatch /usr/src/app/node_modules/minimatch
COPY --from=builder /usr/src/app/node_modules/path-is-absolute /usr/src/app/node_modules/path-is-absolute
COPY --from=builder /usr/src/app/node_modules/inflight /usr/src/app/node_modules/inflight
# used by inflight
COPY --from=builder /usr/src/app/node_modules/wrappy /usr/src/app/node_modules/wrappy
COPY --from=builder /usr/src/app/node_modules/once /usr/src/app/node_modules/once
# used by minimatch
COPY --from=builder /usr/src/app/node_modules/brace-expansion /usr/src/app/node_modules/brace-expansion
# used by brance-expansion
COPY --from=builder /usr/src/app/node_modules/concat-map /usr/src/app/node_modules/concat-map
COPY --from=builder /usr/src/app/node_modules/balanced-match /usr/src/app/node_modules/balanced-match
# used by npmlog
COPY --from=builder /usr/src/app/node_modules/are-we-there-yet /usr/src/app/node_modules/are-we-there-yet
COPY --from=builder /usr/src/app/node_modules/gauge /usr/src/app/node_modules/gauge
COPY --from=builder /usr/src/app/node_modules/set-blocking /usr/src/app/node_modules/set-blocking
# used by gauge
COPY --from=builder /usr/src/app/node_modules/console-control-strings /usr/src/app/node_modules/console-control-strings
COPY --from=builder /usr/src/app/node_modules/wide-align /usr/src/app/node_modules/wide-align
COPY --from=builder /usr/src/app/node_modules/aproba /usr/src/app/node_modules/aproba
COPY --from=builder /usr/src/app/node_modules/object-assign /usr/src/app/node_modules/object-assign
COPY --from=builder /usr/src/app/node_modules/has-unicode /usr/src/app/node_modules/has-unicode
COPY --from=builder /usr/src/app/node_modules/signal-exit /usr/src/app/node_modules/signal-exit
# used by wide-align
COPY --from=builder /usr/src/app/node_modules/string-width /usr/src/app/node_modules/string-width
# used by string-width
COPY --from=builder /usr/src/app/node_modules/strip-ansi /usr/src/app/node_modules/strip-ansi
COPY --from=builder /usr/src/app/node_modules/code-point-at /usr/src/app/node_modules/code-point-at
COPY --from=builder /usr/src/app/node_modules/is-fullwidth-code-point /usr/src/app/node_modules/is-fullwidth-code-point
# used by is-fullwidth-code-point
COPY --from=builder /usr/src/app/node_modules/number-is-nan /usr/src/app/node_modules/number-is-nan
# used by strip-ansi
COPY --from=builder /usr/src/app/node_modules/ansi-regex /usr/src/app/node_modules/ansi-regex
# used by are-we-there-yet
COPY --from=builder /usr/src/app/node_modules/delegates /usr/src/app/node_modules/delegates
# used by nopt
COPY --from=builder /usr/src/app/node_modules/abbrev /usr/src/app/node_modules/abbrev
COPY --from=builder /usr/src/app/node_modules/osenv /usr/src/app/node_modules/osenv
# used by osenv
COPY --from=builder /usr/src/app/node_modules/os-tmpdir /usr/src/app/node_modules/os-tmpdir
COPY --from=builder /usr/src/app/node_modules/os-homedir /usr/src/app/node_modules/os-homedir
# icons
COPY --from=builder /usr/src/app/node_modules/bootstrap-sass/assets/fonts/bootstrap /usr/src/app/node_modules/bootstrap-sass/assets/fonts/bootstrap
# icons
COPY --from=builder /usr/src/app/node_modules/bootstrap-sass/assets/fonts/bootstrap /usr/src/app/node_modules/bootstrap-sass/assets/fonts/bootstrap
# flexboxgrid
COPY --from=builder /usr/src/app/node_modules/flexboxgrid/dist/flexboxgrid.css /usr/src/app/node_modules/flexboxgrid/dist/flexboxgrid.css
