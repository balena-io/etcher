Publishing Resin Etcher
=======================

This is a small guide to package and publish Resin Etcher to all supported operating systems.

Packaging
---------

You need to install [wine](https://www.winehq.org) and [nsis](http://nsis.sourceforge.net/Main_Page) to package the application for Windows.

Make sure you install npm dependencies with `--force` since there might be optional dependencies for an operating system not equal to the host that will not make it to the package otherwise:

```sh
npm install --force
```

Run the following command to package Resin Etcher

```sh
make installer-osx
```

The resulting packages will be saved to `release/installers`.

You can run `make clean` to start in a fresh state.
