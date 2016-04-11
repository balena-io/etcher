Publishing Etcher
=================

This is a small guide to package and publish Etcher to all supported operating systems.

Prequisites
-----------

- [NodeJS](https://nodejs.org)
- [GNU Make](https://www.gnu.org/software/make/)
- [wine (for Windows)](https://www.winehq.org)
- [nsis (for Windows)](http://nsis.sourceforge.net/Main_Page)
- [XCode (for OS X)](https://developer.apple.com/xcode://developer.apple.com/xcode/)
- [AWS CLI (for uploading packages)](https://aws.amazon.com/cli://aws.amazon.com/cli/)
- [osslsigncode (for signing the Windows installers)](https://sourceforge.net/projects/osslsigncode/)
- [UPX](http://upx.sourceforge.net)

If you're going to generate installers for another platform than the one you're currently running, make sure you force-install all NPM dependencies, so optional dependencies marked for a certain operating system get installed regardless of the host operating system

```sh
npm install --force
```

You can run the following command at any time to start from a fresh state:

```sh
make clean
```

Signing
-------

### OS X

1. Get our Apple Developer ID certificate for signing applications distributed outside the Mac App Store from the Resin.io Apple account.

2. Install the Developer ID certificate to your Mac's Keychain by double clicking on the certificate file.

The application will be signed automatically using this certificate when packaging for OS X.

### Windows

1. Get access to our code signing certificate and decryption key as a Resin.io employee by asking for it to the relevant people.

2. Place the cert and key in the root of the Etcher repository naming them `certificate.crt.pem` and `certificate.key.pem`, respectively.

The application and installer will be signed automatically using these certificates when packaging for Windows.

Packaging
---------

Run the following command to make installers for all supported operating systems:

```sh
make installer-all
```

You can replace `all` with `osx`, `linux` or `win32` to only generate installers for those platforms:

```sh
make installer-osx
make installer-linux
make installer-win32
```

The resulting installers will be saved to `etcher-release/installers`.

Uploading
---------

Make sure you have the [AWS CLI tool](https://aws.amazon.com/cli://aws.amazon.com/cli/) installed and configured to access Resin.io's production downloads S3 bucket.

Run the following command to upload all installers:

```sh
make upload-all
```

As with the `installer` rule, you can replace `all` with `osx`, `linux` or `win32` to only publish those platform's installers:

```sh
make upload-osx
make upload-linux
make upload-win32
```
