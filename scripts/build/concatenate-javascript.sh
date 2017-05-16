#!/bin/bash

###
# Copyright 2016 resin.io
#
# Licensed under the Apache License, Version 2.0 (the "License");
# you may not use this file except in compliance with the License.
# You may obtain a copy of the License at
#
#   http://www.apache.org/licenses/LICENSE-2.0
#
# Unless required by applicable law or agreed to in writing, software
# distributed under the License is distributed on an "AS IS" BASIS,
# WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
# See the License for the specific language governing permissions and
# limitations under the License.
###

set -u
set -e

BROWSERIFY="./node_modules/.bin/browserify"
./scripts/build/check-dependency.sh "$BROWSERIFY"

function usage() {
  echo "Usage: $0"
  echo ""
  echo "Options"
  echo ""
  echo "    -e <entry point (.js)>"
  echo "    -b <base directory>"
  echo "    -o <output>"
  echo "    -m minify"
  exit 1
}

ARGV_ENTRY_POINT=""
ARGV_BASE_DIRECTORY=""
ARGV_OUTPUT=""
ARGV_MINIFY=false

while getopts ":e:b:o:m" option; do
  case $option in
    e) ARGV_ENTRY_POINT=$OPTARG ;;
    b) ARGV_BASE_DIRECTORY=$OPTARG ;;
    o) ARGV_OUTPUT=$OPTARG ;;
    m) ARGV_MINIFY=true ;;
    *) usage ;;
  esac
done

if [ -z "$ARGV_ENTRY_POINT" ] ||
   [ -z "$ARGV_BASE_DIRECTORY" ] ||
   [ -z "$ARGV_OUTPUT" ]; then
  usage
fi

"$BROWSERIFY" "$ARGV_BASE_DIRECTORY/$ARGV_ENTRY_POINT" --node --outfile "$ARGV_OUTPUT"

# This hack workarounds the fact the Browserify stores absolute paths
# of the machine that was used to produce the bundle, giving "not found"
# module errors when executing it in another computer.
# The fix is to replace absolute paths with `__dirname`
node <<EOF > "$ARGV_OUTPUT.TMP"
const separator = process.platform === 'win32' ? '\\\\\\\\\\\\\\\\' : '\\/';
const baseDirectory = process.platform === 'win32'
  ? "$ARGV_BASE_DIRECTORY".replace(/\//g, separator)
  : "$ARGV_BASE_DIRECTORY";

const regex = new RegExp('"(.)+' + baseDirectory.replace(/\+/g, '\\\\+') + separator, 'g');
const contents = require('fs').readFileSync("$ARGV_OUTPUT", { encoding: 'utf8' });

console.log(contents.split('\n').map((line) => {
  if (!regex.test(line)) return line;
  return line
    .replace(regex, 'require("path").join(__dirname,"')
    .replace(new RegExp(separator, 'g'), '","') + ')';
}).join('\n'));
EOF
mv "$ARGV_OUTPUT.TMP" "$ARGV_OUTPUT"

if [ "$ARGV_MINIFY" == "true" ]; then
  ./scripts/build/check-dependency.sh uglifyjs
  uglifyjs --compress --output "$ARGV_OUTPUT.MIN" -- "$ARGV_OUTPUT"
  mv "$ARGV_OUTPUT.MIN" "$ARGV_OUTPUT"
fi
