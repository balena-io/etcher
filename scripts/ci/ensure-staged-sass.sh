#!/bin/bash

set -e
set -u

npm run sass

# From http://stackoverflow.com/a/9393642/1641422
if [[ -n $(git status -s) ]]; then
  echo "There are unstaged sass changes. Please commit the result of:" 1>&2
  echo ""
  echo "    npm run sass" 1>&2
  echo ""
  exit 1
fi
