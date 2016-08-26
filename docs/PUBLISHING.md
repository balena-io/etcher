Publishing Etcher
=================

This is a small guide to package and publish Etcher to all supported operating
systems.

Signing
-------

### OS X

1. Get our Apple Developer ID certificate for signing applications distributed
outside the Mac App Store from the Resin.io Apple account.

2. Install the Developer ID certificate to your Mac's Keychain by double
clicking on the certificate file.

The application will be signed automatically using this certificate when
packaging for OS X.

### Windows

1. Get access to our code signing certificate and decryption key as a Resin.io
employee by asking for it to the relevant people.

2. Place the certificate in the root of the Etcher repository naming it
`certificate.p12`.

Packaging
---------

The resulting installers will be saved to `etcher-release/installers`.

Run the following command:

```sh
$ ./scripts/build/darwin.sh all
```

### GNU/Linux

Run the following command:

```sh
$ ./scripts/build/linux.sh all <x64|x86>
```

Publishing
----------

- [AWS CLI][aws-cli]

Make sure you have the [AWS CLI tool][aws-cli] installed and configured to
access Resin.io's production downloads S3 bucket.

> The publishing script only runs on UNIX based operating systems for now. You
> can use something like [Cygwin](https://cygwin.com) to run it on Windows.

Run the following command:

```sh
./scripts/publish.sh <file>
```

[package-json]: https://github.com/resin-io/etcher/blob/master/package.json
[aws-cli]: https://aws.amazon.com/cli://aws.amazon.com/cli/
