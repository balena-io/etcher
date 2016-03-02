Publishing Etcher
=================

This is a small guide to package and publish Etcher to all supported operating systems.

Prequisites
-----------

- [wine](https://www.winehq.org)
- [nsis](http://nsis.sourceforge.net/Main_Page)
- [node](https://nodejs.org)
- [GNU Make](https://www.gnu.org/software/make/)

Signing
-------

### OS X

1. Get our Apple Developer ID certificate for signing applications distributed outside the Mac App Store from the Resin.io Apple account.

2. Install the Developer ID certificate to your Mac's Keychain by double clicking on the certificate file.

The application will be signed automatically using this certificate when packaging for OS X.

Packaging
---------

Run the following command to make installers for all supported operating systems:

```sh
make release
```

The resulting installers will be saved to `etcher-release/installers`.

You can run `make clean` to start in a fresh state.
