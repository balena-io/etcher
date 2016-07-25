Publishing Etcher
=================

This is a small guide to package and publish Etcher to all supported operating
systems.

Common Pre-requisites
---------------------

- [NodeJS](https://nodejs.org)
- [Bower](http://bower.io)
- [UPX](http://upx.sourceforge.net)
- [Python](https://www.python.org)

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

### Windows

Pre-requisites:

- [NSIS](http://nsis.sourceforge.net/Main_Page)
- [Visual Studio Community 2013](https://www.visualstudio.com/en-us/news/vs2013-community-vs.aspx)
- [Rimraf](https://github.com/isaacs/rimraf)
- [asar](https://github.com/electron/asar)

Run the following command from the *Developer Command Prompt for VS2013*, to
ensure all Visual Studio command utilities are available in the `%PATH%`:

```sh
> .\scripts\build\windows.bat all <x64|x86>
```

### OS X

Pre-requisites:

- [XCode](https://developer.apple.com/xcode://developer.apple.com/xcode/)

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
