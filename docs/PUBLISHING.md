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

The resulting installers will be saved to `etcher-release/installers`.

### OS X

Run the following command:

```sh
$ ./scripts/build/darwin.sh all
```

### GNU/Linux

Run the following command:

```sh
$ ./scripts/build/linux.sh all <x64|x86>
```

### Windows

Run the following command:

```sh
> .\scripts\build\windows.bat all <x64|x86>
```

Publishing to Bintray
---------------------

We publish GNU/Linux Debian packages to [Bintray][bintray].

Make sure you set the following environment variables:

- `BINTRAY_USER`
- `BINTRAY_API_KEY`

Run the following command:

```sh
./scripts/publish/bintray-debian.sh <debfile>
```

Publishing to S3
----------------

- [AWS CLI][aws-cli]

Make sure you have the [AWS CLI tool][aws-cli] installed and configured to
access resin.io's production downloads S3 bucket.

> The publishing script only runs on UNIX based operating systems for now. You
> can use something like [Cygwin][cygwin] to run it on Windows.

Run the following command:

```sh
./scripts/publish/aws-s3.sh <file>
```

Announcing
----------

Post a message to https://talk.resin.io/c/etcher/annoucements announcing the
new version of Etcher, and including the relevant section of the Changelog.

[aws-cli]: https://aws.amazon.com/cli
[cygwin]: https://cygwin.com
[bintray]: https://bintray.com
