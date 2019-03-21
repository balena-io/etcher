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
- [Generate build artifacts](#generating-binaries) (binaries, archives, etc.)
- [Draft a release on GitHub](https://github.com/balena-io/etcher/releases)
    - Upload build artifacts to GitHub release draft

#### Testing

- Test the prepared release and build artifacts properly on **all supported operating systems** to prevent regressions that went uncaught by the CI tests (see [MANUAL-TESTING.md](MANUAL-TESTING.md))
- If regressions or other issues arise, create issues on the repository for each one, and decide whether to fix them in this release (meaning repeating the process up until this point), or to follow up with a patch release

#### Publishing

- [Publish release draft on GitHub](https://github.com/balena-io/etcher/releases)
- [Post release note to forums](https://forums.balena.io/c/etcher)
- [Submit Windows binaries to Symantec for whitelisting](#submitting-binaries-to-symantec)
- [Update the website](https://github.com/balena-io/etcher-homepage)
- Wait 2-3 hours for analytics (Sentry, Mixpanel) to trickle in and check for elevated error rates, or regressions
- If regressions arise; pull the release, and release a patched version, else:
- [Upload deb & rpm packages to Bintray](#uploading-packages-to-bintray)
- [Upload build artifacts to Amazon S3](#uploading-binaries-to-amazon-s3)
- Post changelog with `#release-notes` tag on Flowdock
- If this release packs noteworthy major changes:
  - Write a blog post about it, and / or
  - Write about it to the Etcher mailing list

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

##### Generating artifacts

```bash
# x64

# Build Debian packages
./scripts/build/docker/run-command.sh -r x64 -s . -c "make electron-develop && make RELEASE_TYPE=production electron-installer-debian"
# Build RPM packages
./scripts/build/docker/run-command.sh -r x64 -s . -c "make electron-develop && make RELEASE_TYPE=production electron-installer-redhat"
# Build AppImages
./scripts/build/docker/run-command.sh -r x64 -s . -c "make electron-develop && make RELEASE_TYPE=production electron-installer-appimage"

# x86

# Build Debian packages
./scripts/build/docker/run-command.sh -r x86 -s . -c "make electron-develop && make RELEASE_TYPE=production electron-installer-debian"
# Build RPM packages
./scripts/build/docker/run-command.sh -r x86 -s . -c "make electron-develop && make RELEASE_TYPE=production electron-installer-redhat"
# Build AppImages
./scripts/build/docker/run-command.sh -r x86 -s . -c "make electron-develop && make RELEASE_TYPE=production electron-installer-appimage"
```

#### Mac OS

**ATTENTION:** For production releases you'll need the code-signing key,
and set `CSC_NAME` to generate signed binaries on Mac OS.

```bash
make electron-develop

# Build the zip
make RELEASE_TYPE=production electron-installer-app-zip
# Build the dmg
make RELEASE_TYPE=production electron-installer-dmg
```

#### Windows

**ATTENTION:** For production releases you'll need the code-signing key,
and set `CSC_LINK`, and `CSC_KEY_PASSWORD` to generate signed binaries on Windows.

**NOTE:**
- Keep in mind to also generate artifacts for x86, with `TARGET_ARCH=x86`.

```bash
make electron-develop

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
./scripts/publish/bintray.sh -c "etcher" -t "production" -v "1.2.1" -o "etcher" -p "debian" -y "debian" -r "x64" -f "dist/etcher-electron_1.2.1_amd64.deb"
./scripts/publish/bintray.sh -c "etcher" -t "production" -v "1.2.1" -o "etcher" -p "debian" -y "debian" -r "x86" -f "dist/etcher-electron_1.2.1_i386.deb"
./scripts/publish/bintray.sh -c "etcher" -t "production" -v "1.2.1" -o "etcher" -p "redhat" -y "redhat" -r "x64" -f "dist/etcher-electron-1.2.1.x86_64.rpm"
./scripts/publish/bintray.sh -c "etcher" -t "production" -v "1.2.1" -o "etcher" -p "redhat" -y "redhat" -r "x86" -f "dist/etcher-electron-1.2.1.i686.rpm"
```

### Uploading binaries to Amazon S3

```bash
export S3_KEY="..."
```

```bash
./scripts/publish/aws-s3.sh -b "balena-production-downloads" -v "1.2.1" -p "etcher" -f "dist/<filename>"
```

### Dealing with a Problematic Release

There can be times where a release is accidentally plagued with bugs. If you
released a new version and notice the error rates are higher than normal, then
revert the problematic release as soon as possible, until the bugs are fixed.

You can revert a version by deleting its builds from the S3 bucket and Bintray.
Refer to the `Makefile` for the up to date information about the S3 bucket
where we push builds to, and get in touch with the balena.io operations team to
get write access to it.

The Etcher update notifier dialog and the website only show the a certain
version if all the expected files have been uploaded to it, so deleting a
single package or two is enough to bring down the whole version.

Use the following command to delete files from S3:

```bash
aws s3api delete-object --bucket <bucket name> --key <file name>
```

The Bintray dashboard provides an easy way to delete a version's files.


### Submitting binaries to Symantec

- [Report a Suspected Erroneous Detection](https://submit.symantec.com/false_positive/standard/)
- Fill out form:
  - **Select Submission Type:** "Provide a direct download URL"
  - **Name of the software being detected:** Etcher
  - **Name of detection given by Symantec product:** WS.Reputation.1
  - **Contact name:** Balena.io Ltd
  - **E-mail address:** hello@etcher.io
  - **Are you the creator or distributor of the software in question?** Yes
