Publishing Etcher
=================

This is a small guide to package and publish Etcher to all supported operating systems.

Prequisites
-----------

- [wine](https://www.winehq.org)
- [nsis](http://nsis.sourceforge.net/Main_Page)
- [node](https://nodejs.org)
- [GNU Make](https://www.gnu.org/software/make/)

Run the following command to make installers for all supported operating systems:

```sh
make release
```

The resulting installers will be saved to `etcher-release/installers`.

You can run `make clean` to start in a fresh state.
