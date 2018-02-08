Maintaining Etcher
==================

This document is meant to serve as a guide for maintainers to perform common tasks.

Releasing
---------

### Release Types

- **snapshot** (default): A continues snapshot of current master, made by the CI services
- **production**: Full releases

### Flight Plan

#### Preparation

- [Prepare the new version](#preparing-a-new-version)
- [Generate build artefacts](#generating-binaries) (binaries, archives, etc.)
- [Draft a release on GitHub](https://github.com/resin-io/etcher/releases)
    - Upload build artefacts to GitHub release draft

#### Testing

- Test the prepared release and build artefacts properly on **all supported operating systems** to prevent regressions that went uncaught by the CI tests (see [MANUAL-TESTING.md](MANUAL-TESTING.md))
- If regressions or other issues arise, create issues on the repository for each one, and decide whether to fix them in this release (meaning repeating the process up until this point), or to follow up with a patch release

#### Publishing

- [Publish release draft on GitHub](https://github.com/resin-io/etcher/releases)
- [Post release note to forums](https://forums.resin.io/c/etcher)
- [Update the website](https://github.com/resin-io/etcher-homepage)
- Wait 2-3 hours for analytics (Sentry, Mixpanel) to trickle in and check for elevated error rates, or regressions
- If regressions arise; pull the release, and release a patched version, else:
- [Upload deb & rpm packages to Bintray](#uploading-packages-to-bintray)
- [Upload build artefacts to Amazon S3](#uploading-binaries-to-amazon-s3)
- Post changelog with `#release-notes` tag on Flowdock
- If this release packs noteworthy major changes:
  - Write a blog post about it, and / or
  - Write about it to the Etcher mailing list

### Preparing a New Version

- Create & hop onto a new release branch, i.e. `release-1.0.0`
- Bump the version number in the `package.json`'s `version` property.
- Bump the version number in the `npm-shrinkwrap.json`'s `version` property
- Add a new entry to `CHANGELOG.md` by running `make changelog`
- Manually revise the `CHANGELOG.md` versionist output
- Update `screenshot.png` so it displays the latest version in the bottom
right corner
- Revise the `updates.semverRange` version in `package.json`
- Commit the changes with the version number as the commit title, including the `v` prefix, to `master`. For example:

**NOTE:** The version **MUST** be prefixed with a "v"

```bash
git commit -m "v1.0.0" # not 1.0.0
```

- Create an annotated tag for the new version. The commit title should equal the annotated tag name. For example:

```bash
git tag -a v1.0.0 -m "v1.0.0"
```

- Push the commit and the annotated tag.

```bash
git push
git push --tags
```

- Open a pull request against `master` titled "Release v1.0.0"

### Generating binaries

**Environment**

Make sure to set the analytics tokens when generating production release binaries:

```bash
export ANALYTICS_SENTRY_TOKEN="xxxxxx"
export ANALYTICS_MIXPANEL_TOKEN="xxxxxx"
```

#### Linux

##### Clean dist folder

**NOTE:** Make sure to adjust the path as necessary (here the Etcher repository has been cloned to `/home/$USER/code/etcher`)

```bash
./scripts/build/docker/run-command.sh -r x64 -s . -c "make distclean"
```

##### Generating artefacts

```bash
# x64

# Build Debian packages
./scripts/build/docker/run-command.sh -r x64 -s . -c "make electron-develop && make RELEASE_TYPE=production electron-installer-debian"
# Build RPM packages
./scripts/build/docker/run-command.sh -r x64 -s . -c "make electron-develop && make RELEASE_TYPE=production electron-installer-redhat"
# Build AppImages
./scripts/build/docker/run-command.sh -r x64 -s . -c "make electron-develop && make RELEASE_TYPE=production electron-installer-appimage"
# Build CLI
./scripts/build/docker/run-command.sh -r x64 -s . -c "make electron-develop && make RELEASE_TYPE=production cli-installer-tar-gz"

# x86

# Build Debian packages
./scripts/build/docker/run-command.sh -r x86 -s . -c "make electron-develop && make RELEASE_TYPE=production electron-installer-debian"
# Build RPM packages
./scripts/build/docker/run-command.sh -r x86 -s . -c "make electron-develop && make RELEASE_TYPE=production electron-installer-redhat"
# Build AppImages
./scripts/build/docker/run-command.sh -r x86 -s . -c "make electron-develop && make RELEASE_TYPE=production electron-installer-appimage"
# Build CLI
./scripts/build/docker/run-command.sh -r x86 -s . -c "make electron-develop && make RELEASE_TYPE=production cli-installer-tar-gz"
```

#### Mac OS

**ATTENTION:** For production releases you'll need the code-signing key,
and set `CSC_NAME` to generate signed binaries on Mac OS.

**NOTE:** The CLI is not code-signed for either at this time.

```bash
make electron-develop

# Build the CLI
make RELEASE_TYPE=production cli-installer-tar-gz
# Build the zip
make RELEASE_TYPE=production electron-installer-app-zip
# Build the dmg
make RELEASE_TYPE=production electron-installer-dmg
```

#### Windows

**ATTENTION:** For production releases you'll need the code-signing key,
and set `CSC_LINK`, and `CSC_KEY_PASSWORD` to generate signed binaries on Windows.

**NOTE:**
- The CLI is not code-signed for either at this time.
- Keep in mind to also generate artefacts for x86, with `TARGET_ARCH=x86`.

```bash
make electron-develop

# Build the CLI
make RELEASE_TYPE=production cli-installer-zip
# Build the Portable version
make RELEASE_TYPE=production electron-installer-portable
# Build the Installer
make RELEASE_TYPE=production electron-installer-nsis
```

### Uploading packages to Bintray

```bash
export BINTRAY_USER="username@account"
export BINTRAY_API_KEY="youruserapikey"
```

```bash
./scripts/publish/bintray.sh -c "etcher" -t "production" -v "1.2.1" -o "resin-io" -p "debian" -y "debian" -r "x64" -f "dist/etcher-electron_1.2.1_amd64.deb"
./scripts/publish/bintray.sh -c "etcher" -t "production" -v "1.2.1" -o "resin-io" -p "debian" -y "debian" -r "x86" -f "dist/etcher-electron_1.2.1_i386.deb"
./scripts/publish/bintray.sh -c "etcher" -t "production" -v "1.2.1" -o "resin-io" -p "redhat" -y "redhat" -r "x64" -f "dist/etcher-electron-1.2.1.x86_64.rpm"
./scripts/publish/bintray.sh -c "etcher" -t "production" -v "1.2.1" -o "resin-io" -p "redhat" -y "redhat" -r "x86" -f "dist/etcher-electron-1.2.1.i686.rpm"
```

### Uploading binaries to Amazon S3

```bash
export S3_KEY="..."
```

```bash
./scripts/publish/aws-s3.sh -b "resin-production-downloads" -v "1.2.1" -p "etcher" -f "dist/<filename>"
```

### Dealing with a Problematic Release

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

```bash
aws s3api delete-object --bucket <bucket name> --key <file name>
```

The Bintray dashboard provides an easy way to delete a version's files.
