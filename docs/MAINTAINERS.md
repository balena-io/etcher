Maintaining Etcher
==================

This document is meant to serve as a guide for maintainers to perform common
tasks.

Preparing a new version
-----------------------

- Bump the version number in the `package.json`'s `version` property.

- Bump the version number in the `npm-shrinkwrap.json`'s `version` property.

- Add a new entry to `CHANGELOG.md` by running `make CHANGELOG.md`.

- Re-take `screenshot.png` so it displays the latest version in the bottom
right corner.

- Revise the `updates.semverRange` version in `package.json`

- Commit the changes with the version number as the commit title, including the
`v` prefix, to `master`. For example:

```sh
git commit -m "v1.0.0" # not 1.0.0
```

- Create an annotated tag for the new version. The commit title should equal
the annotated tag name. For example:

```sh
git tag -a v1.0.0 -m "v1.0.0"
```

- Push the commit and the annotated tag.

```sh
git push
git push --tags
```

Upgrading Electron
------------------

- Upgrade the `electron` dependency version in `package.json` to an *exact
  version* (no `~`, `^`, etc).

Dealing with a problematic release
----------------------------------

There can be times where a release is accidentally plagued with bugs. If you
released a new version and notice the error rates are higher than normal, then
revert the problematic release as soon as possible, until the bugs are fixed.

You can revert a version by deleting its builds from the S3 bucket and Bintray.
Refer to the `Makefile` for the up to date information about the S3 bucket
where we push builds to, and get in touch with the resin.io operations team to
get write access to it.

The Etcher update notifier dialog and the website only show the a certain
version if all the expected files have been uploaded to it, so deleting a
single package or two is enough to bring down the whole version.

Use the following command to delete files from S3:

```sh
aws s3api delete-object --bucket <bucket name> --key <file name>
```

The Bintray dashboard provides an easy way to delete a version's files.
