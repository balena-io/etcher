Publishing Herostratus
======================

This is a small guide to package and publish Herostratus to all supported operating systems.

Packaging
---------

You need to install [wine](https://www.winehq.org) to package the application for Windows.

Run the following command to package Herostratus:

```sh
# all supported operating systems
make package-all

# or a single operating system
make package-osx
make package-linux
make package-win32
```

The resulting packages will be saved to `release/`.

You can run `make clean` to start in a fresh state.
