Publishing Etcher
=================

This is a small guide to package and publish Etcher to all supported operating
systems.

Release Types
-------------

Etcher supports **production** and **snapshot** release types. Each is
published to a different S3 bucket, and production release types are code
signed, while snapshot release types aren't and include a short git commit-hash
as a build number. For example, `1.0.0-beta.19` is a production release type,
while `1.0.0-beta.19+531ab82` is a snapshot release type.

In terms of comparison: `1.0.0-beta.19` (production) < `1.0.0-beta.19+531ab82`
(snapshot) < `1.0.0-rc.1` (production) < `1.0.0-rc.1+7fde24a` (snapshot) <
`1.0.0` (production) < `1.0.0+2201e5f` (snapshot). Keep in mind that if you're
running a production release type, you'll only be prompted to update to
production release types, and if you're running a snapshot release type, you'll
only be prompted to update to other snapshot release types.

The build system creates (and publishes) snapshot release types by default, but
you can build a specific release type by setting the `RELEASE_TYPE` make
variable.  For example:

```sh
make <target> RELEASE_TYPE=snapshot
make <target> RELEASE_TYPE=production
```

We can control the version range a specific Etcher version will consider when
showing the update notification dialog by tweaking the `updates.semverRange`
property of `package.json`.

Update Channels
---------------

Etcher has a setting to include the unstable update channel. If this option is
set, Etcher will consider both stable and unstable versions when showing the
update notifier dialog. Unstable versions are the ones that contain a `beta`
pre-release tag. For example:

- Production unstable version: `1.4.0-beta.1`
- Snapshot unstable version: `1.4.0-beta.1+7fde24a`
- Production stable version: `1.4.0`
- Snapshot stable version: `1.4.0+7fde24a`

Signing
-------

### OS X

1. Get our Apple Developer ID certificate for signing applications distributed
outside the Mac App Store from the balena.io Apple account.

2. Install the Developer ID certificate to your Mac's Keychain by double
clicking on the certificate file.

The application will be signed automatically using this certificate when
packaging for OS X.

### Windows

1. Get access to our code signing certificate and decryption key as a balena.io
employee by asking for it from the relevant people.

2. Place the certificate in the root of the Etcher repository naming it
`certificate.p12`.

Packaging
---------

The resulting installers will be saved to `dist/out`.

Run the following commands:

### OS X

```sh
make electron-installer-dmg
make electron-installer-app-zip
```

### GNU/Linux

```sh
make electron-installer-appimage
make electron-installer-debian
```

### Windows

```sh
make electron-installer-zip
make electron-installer-nsis
```

Publishing to Bintray
---------------------

We publish GNU/Linux Debian packages to [Bintray][bintray].

Make sure you set the following environment variables:

- `BINTRAY_USER`
- `BINTRAY_API_KEY`

Run the following command:

```sh
make publish-bintray-debian
```

Publishing to S3
----------------

- [AWS CLI][aws-cli]

Make sure you have the [AWS CLI tool][aws-cli] installed and configured to
access balena.io's production or snapshot S3 bucket.

Run the following command to publish all files for the current combination of
_platform_ and _arch_ (building them if necessary):

```sh
make publish-aws-s3
```

Also add links to each AWS S3 file in [GitHub Releases][github-releases]. See
[`v1.0.0-beta.17`](https://github.com/balena-io/etcher/releases/tag/v1.0.0-beta.17)
as an example.

Publishing to Homebrew Cask
---------------------------

1. Update [`Casks/etcher.rb`][etcher-cask-file] with the new version and
   `sha256`

2. Send a PR with the changes above to
   [`caskroom/homebrew-cask`][homebrew-cask]

Announcing
----------

Post messages to the [Etcher forum][balena-forum-etcher] announcing the new version
of Etcher, and including the relevant section of the Changelog.

[aws-cli]: https://aws.amazon.com/cli
[bintray]: https://bintray.com
[etcher-cask-file]: https://github.com/caskroom/homebrew-cask/blob/master/Casks/balenaetcher.rb
[homebrew-cask]: https://github.com/caskroom/homebrew-cask
[balena-forum-etcher]: https://forums.balena.io/c/etcher
[github-releases]: https://github.com/balena-io/etcher/releases
