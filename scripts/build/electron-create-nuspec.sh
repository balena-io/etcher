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

function usage() {
  echo "Usage: $0"
  echo ""
  echo "Options"
  echo ""
  echo "    -n <application name>"
  echo "    -x <application id>"
  echo "    -s <application summary>"
  echo "    -d <application description>"
  echo "    -v <application version>"
  echo "    -a <application author>"
  echo "    -i <application icon url (.png)>"
  echo "    -l <license file url>"
  echo "    -u <project url>"
  echo "    -b <bug tracker url>"
  echo "    -c <docs url>"
  echo "    -t <temporary directory>"
  echo "    -o <output>"
  exit 1
}

ARGV_NAME=""
ARGV_ID=""
ARGV_SUMMARY=""
ARGV_DESCRIPTION=""
ARGV_VERSION=""
ARGV_AUTHOR=""
ARGV_ICON_URL=""
ARGV_LICENSE_URL=""
ARGV_URL=""
ARGV_BUG_TRACKER_URL=""
ARGV_DOCS_URL=""
ARGV_OUTPUT=""

while getopts ":n:x:s:d:v:a:i:l:u:b:c:o:" option; do
  case $option in
    n) ARGV_NAME="$OPTARG" ;;
    x) ARGV_ID="$OPTARG" ;;
    s) ARGV_SUMMARY="$OPTARG" ;;
    d) ARGV_DESCRIPTION="$OPTARG" ;;
    v) ARGV_VERSION="$OPTARG" ;;
    a) ARGV_AUTHOR="$OPTARG" ;;
    i) ARGV_ICON_URL="$OPTARG" ;;
    l) ARGV_LICENSE_URL="$OPTARG" ;;
    u) ARGV_URL="$OPTARG" ;;
    b) ARGV_BUG_TRACKER_URL="$OPTARG" ;;
    c) ARGV_DOCS_URL="$OPTARG" ;;
    o) ARGV_OUTPUT="$OPTARG" ;;
    *) usage ;;
  esac
done

if [ -z "$ARGV_NAME" ] ||
   [ -z "$ARGV_ID" ] ||
   [ -z "$ARGV_SUMMARY" ] ||
   [ -z "$ARGV_DESCRIPTION" ] ||
   [ -z "$ARGV_VERSION" ] ||
   [ -z "$ARGV_AUTHOR" ] ||
   [ -z "$ARGV_ICON_URL" ] ||
   [ -z "$ARGV_LICENSE_URL" ] ||
   [ -z "$ARGV_URL" ] ||
   [ -z "$ARGV_BUG_TRACKER_URL" ] ||
   [ -z "$ARGV_DOCS_URL" ] ||
   [ -z "$ARGV_OUTPUT" ]; then
  usage
fi

# Nuspec expect HTML escaped strings
SUMMARY="$(echo "$ARGV_SUMMARY" | sed 's/&/&amp;/g')"
DESCRIPTION="$(echo "$ARGV_DESCRIPTION" | sed 's/&/&amp;/g')"

cat << EOF > "$ARGV_OUTPUT"
<?xml version="1.0" encoding="utf-8"?>
<package xmlns="http://schemas.microsoft.com/packaging/2015/06/nuspec.xsd">
  <metadata>
    <id>$ARGV_ID</id>
    <title>$ARGV_NAME</title>
    <version>$ARGV_VERSION</version>
    <authors>$ARGV_AUTHOR</authors>
    <owners>$ARGV_AUTHOR</owners>
    <summary>$SUMMARY</summary>
    <description>
      $DESCRIPTION
    </description>
    <projectUrl>$ARGV_URL</projectUrl>
    <licenseUrl>$ARGV_LICENSE_URL</licenseUrl>
    <requireLicenseAcceptance>true</requireLicenseAcceptance>
    <iconUrl>$ARGV_ICON_URL</iconUrl>
    <bugTrackerUrl>$ARGV_BUG_TRACKER_URL</bugTrackerUrl>
    <docsUrl>$ARGV_DOCS_URL</docsUrl>
  </metadata>
  <files>
    <file src="tools\**" target="tools"/>
  </files>
</package>
EOF
