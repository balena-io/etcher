#!/bin/bash

set -e

if [ "$#" -ne 1 ]; then
  echo "Usage: $0 <debfile>" 1>&2
  exit 1
fi

if [ -z $BINTRAY_USER ] || [ -z $BINTRAY_API_KEY ]; then
  echo "Please define the following environment variables:" 1>&2
  echo "" 1>&2
  echo "  BINTRAY_USER" 1>&2
  echo "  BINTRAY_API_KEY" 1>&2
  exit 1
fi

ARGV_FILE=$1
PACKAGE_COMPONENT=etcher
PACKAGE_DISTRIBUTION=stable
PACKAGE_FILE_NAME=$(basename $ARGV_FILE)
PACKAGE_NAME=${PACKAGE_FILE_NAME%.*}
PACKAGE_VERSION=$(echo $PACKAGE_NAME | cut -d_ -f2 | tr "~" "-")
PACKAGE_ARCH=$(echo $PACKAGE_NAME | cut -d_ -f3)

if [ -z $PACKAGE_VERSION ]; then
  echo "Couldn't infer the version from the package file name" 1>&2
  exit 1
fi

if [ -z $PACKAGE_ARCH ]; then
  echo "Couldn't infer the architecture from the package file name" 1>&2
  exit 1
fi

curl --upload-file $ARGV_FILE \
  --user $BINTRAY_USER:$BINTRAY_API_KEY \
  --header "X-Bintray-Debian-Distribution: $PACKAGE_DISTRIBUTION" \
  --header "X-Bintray-Debian-Component: $PACKAGE_COMPONENT" \
  --header "X-Bintray-Debian-Architecture: $PACKAGE_ARCH" \
  --header "X-Bintray-Publish: 1" \
  https://api.bintray.com/content/resin-io/debian/$PACKAGE_COMPONENT/$PACKAGE_VERSION/$PACKAGE_FILE_NAME

echo "$ARGV_FILE has been uploaded successfully"
