#!/bin/sh

set -e

cat > $HOME/bintray.json << EOF
{
  "package": {
    "name": "etcher",
    "repo": "etcher-deb",
    "subject": "dlech",
    "website_url": "bintray.io",
    "issue_tracker_url": "https://github.com/dlech/etcher/issues",
    "vcs_url": "https://github.com/dlech/etcher",
    "licenses": ["Apache-2.0"],
    "public_download_numbers": true,
    "public_stats": true
  },
  "version": {
    "name": "$(dpkg-parsechangelog | grep Version: | cut -b 10-)",
    "released": "$(date --iso-8601)",
    "vcs_tag": "$TRAVIS_TAG"
  },
  "files": [
    {
      "includePattern": "$(dirname $(pwd))/(.*\.deb)\$",
      "uploadPattern": "\$1",
      "matrixParams": {
        "deb_distribution": "precise",
        "deb_component": "main",
        "deb_architecture": "amd64"
      }
    }
  ],
  "publish": true
}
EOF
