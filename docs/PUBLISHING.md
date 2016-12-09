Publishing Etcher
=================

This is a small guide to package and publish Etcher to all supported operating
systems.

Signing
-------

### OS X

1. Get our Apple Developer ID certificate for signing applications distributed
outside the Mac App Store from the resin.io Apple account.

2. Install the Developer ID certificate to your Mac's Keychain by double
clicking on the certificate file.

The application will be signed automatically using this certificate when
packaging for OS X.

### Windows

1. Get access to our code signing certificate and decryption key as a resin.io
employee by asking for it from the relevant people.

2. Place the certificate in the root of the Etcher repository naming it
`certificate.p12`.

Packaging
---------


### OS X

Run the following command:

```sh
make electron-installer-dmg
make electron-installer-app-zip
```

The resulting installers will be saved to `release/out`.

### GNU/Linux

Run the following command:

```sh
make electron-installer-appimage
make electron-installer-debian
```

The resulting installers will be saved to `release/out`.

### Windows

Run the following command:

```sh
> .\scripts\build\windows.bat all <x64|x86>
```

The resulting installers will be saved to `etcher-release/installers`.

Publishing to Bintray
---------------------

We publish GNU/Linux Debian packages to [Bintray][bintray].

Make sure you set the following environment variables:

- `BINTRAY_USER`
- `BINTRAY_API_KEY`

Run the following command:

```sh
make publish-bintray-debian RELEASE_TYPE=<production|snapshot>
```

Publishing to S3
----------------

- [AWS CLI][aws-cli]

Make sure you have the [AWS CLI tool][aws-cli] installed and configured to
access resin.io's production downloads S3 bucket.

> The publishing script only runs on UNIX based operating systems for now. You
> can use something like [Cygwin][cygwin] to run it on Windows.

Run the following command to publish a specific file:

```sh
./scripts/publish/aws-s3.sh -f <file> -b <bucket> -v <version> -t <production|snapshot>
```

Or run the following command to publish all files for the current combination
of _platform_ and _arch_ (building them if necessary) :

```sh
make publish-aws-s3 RELEASE_TYPE=<production|snapshot>
```

Also add links to each AWS S3 file in [GitHub Releases][github-releases]. See
[`v1.0.0-beta.17`](https://github.com/resin-io/etcher/releases/tag/v1.0.0-beta.17)
as an example.

Publishing to Homebrew Cask
---------------------------

1. Update [`Casks/etcher.rb`][etcher-cask-file] with the new version and
   `sha256`

2. Send a PR with the changes above to
   [`caskroom/homebrew-cask`][homebrew-cask]

Announcing
----------

Post messages to the [Etcher forum][resin-forum-etcher] and
[Etcher gitter channel][gitter-etcher] announcing the new version
of Etcher, and including the relevant section of the Changelog.

[aws-cli]: https://aws.amazon.com/cli
[cygwin]: https://cygwin.com
[bintray]: https://bintray.com
[etcher-cask-file]: https://github.com/caskroom/homebrew-cask/blob/master/Casks/etcher.rb
[homebrew-cask]: https://github.com/caskroom/homebrew-cask
[resin-forum-etcher]: https://talk.resin.io/c/etcher/annoucements
[gitter-etcher]: https://gitter.im/resin-io/etcher
[github-releases]: https://github.com/resin-io/etcher/releases
