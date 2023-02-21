Publishing Etcher
=================

This is a small guide to package and publish Etcher to all supported operating
systems.

Release Types
-------------

Etcher supports **pre-release** and **final** release types as does Github. Each is
published to Github releases.
The release version is generated automatically from the commit messasges.

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

Run the following commands on all platforms with the right arguments:

```sh
./node_modules/electron-builder build <...>
```


Publishing to Cloudfront
---------------------

We publish GNU/Linux Debian packages to [Cloudfront][cloudfront].

Log in to cloudfront and upload the `rpm` and `deb` files.

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
[cloudfront]: https://cloudfront.com
[etcher-cask-file]: https://github.com/caskroom/homebrew-cask/blob/master/Casks/balenaetcher.rb
[homebrew-cask]: https://github.com/caskroom/homebrew-cask
[balena-forum-etcher]: https://forums.balena.io/c/etcher
[github-releases]: https://github.com/balena-io/etcher/releases
