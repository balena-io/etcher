#!/usr/bin/env bash

set -ea

[[ "$VERBOSE" =~ on|On|Yes|yes|true|True ]] && set -x

# FIXME: remove when lzma-native ships with win-arm64 suport
# https://github.com/addaleax/lzma-native/issues/132
find patches -type f | xargs cat && npx patch-package
