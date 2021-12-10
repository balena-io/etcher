#!/bin/bash

set -e

if [ $# -ne 2 ]
then
	echo "Usage: $0 {run|build} {all|ecache|test|lint}"
	exit 1
fi

command=$1
target=$2

if [ "$command" = build ]; then
  echo Targeg is build!!
  if [ "$target" = all ]; then
    echo Targeg is all!!
    docker build -t rdbox/gariban2:latest -f rdbox-utils.Dockerfile .
  else
    echo Targeg is enable cache!!
    docker run -t --rm rdbox/gariban2:latest npm run webpack
  fi
elif [ "$command" = run ]; then
  echo Targeg is run!!
  if [ "$target" = all ]; then
    echo Targeg is all!!
    docker run -t --rm rdbox/gariban2:latest npm run test && kill "$(cat /xvfd.pid)"
  elif [ "$target" = test ]; then
    echo Targeg is test!!
    docker run -t --rm rdbox/gariban2:latest npm run test && kill "$(cat /xvfd.pid)"
  elif [ "$target" = lint ]; then
    echo Targeg is lint!!
    docker run -t --rm rdbox/gariban2:latest npm run lint && kill "$(cat /xvfd.pid)"
  else
    echo "Invalid Target type. You can use {all|test|lint}."
    exit 2
  fi
else
  echo "Invalid Target type. You can use {run|build}."
  exit 2
fi

exit 0


