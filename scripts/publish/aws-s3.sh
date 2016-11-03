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

# See http://www.davidpashley.com/articles/writing-robust-shell-scripts/
set -u
set -e

if [ "$#" -ne 1 ]; then
  echo "Usage: $0 <file>" 1>&2
  exit 1
fi

if ! command -v aws 1>/dev/null 2>/dev/null; then
  echo "Dependency missing: aws cli" 1>&2
  exit 1
fi

ETCHER_VERSION=`node -e "console.log(require('./package.json').version)"`
S3_BUCKET="resin-production-downloads"

aws s3api put-object \
  --bucket $S3_BUCKET \
  --acl public-read \
  --key etcher/$ETCHER_VERSION/`basename $1` \
  --body $1
