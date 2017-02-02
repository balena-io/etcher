Etcher
======

> Flash OS images to SD cards & USB drives, safely and easily.

Etcher is a powerful OS image flasher built with web technologies to ensure
flashing an SDCard or USB drive is a pleasant and safe experience. It protects
you from accidentally writing to your hard-drives, ensures every byte of data
was written correctly and much more.

[![dependencies](https://david-dm.org/resin-io/etcher.svg)](https://david-dm.org/resin-io/etcher.svg)
[![Build Status](https://travis-ci.org/resin-io/etcher.svg?branch=master)](https://travis-ci.org/resin-io/etcher)
[![Build status](https://ci.appveyor.com/api/projects/status/e745k1gt39nik0t7/branch/master?svg=true)](https://ci.appveyor.com/project/resin-io/etcher/branch/master)
[![Gitter](https://badges.gitter.im/resin-io/etcher.svg)](https://gitter.im/resin-io/etcher?utm_source=badge&utm_medium=badge&utm_campaign=pr-badge)
[![Stories in Ready](https://badge.waffle.io/resin-io/etcher.svg?label=in progress&title=In Progress)](https://waffle.io/resin-io/etcher)

***

[**Download**][etcher] | [**Support**][SUPPORT] | [**Documentation**][USER-DOCUMENTATION] | [**Contributing**][CONTRIBUTING] | [**Roadmap**][milestones] | [**CLI**][CLI]

![Etcher](https://raw.githubusercontent.com/resin-io/etcher/master/screenshot.png)

Installers
----------

Refer to the [downloads page][etcher] for the latest pre-made
installers for all supported operating systems.

#### Debian and Ubuntu based Package Repository (GNU/Linux x86/x64)

1. Save the following as `/etc/apt/sources.list.d/etcher.list`:

    ```
    deb https://dl.bintray.com/resin-io/debian stable etcher
    ```

2. Trust Bintray.com's GPG key:

    ```sh
    sudo apt-key adv --keyserver hkp://pgp.mit.edu:80 --recv-keys 379CE192D401AB61
    ```

3. Update and install:

    ```sh
    sudo apt-get update
    sudo apt-get install etcher-electron
    ```

#### Brew Cask (macOS)

Note that the Etcher Cask has to be updated manually to point to new versions,
so it might not refer to the latest version immediately after an Etcher
release.

```sh
brew cask install etcher
```

Support
-------

If you're having any problem, please [raise an issue][newissue] on GitHub and
the resin.io team will be happy to help.

License
-------

Etcher is free software, and may be redistributed under the terms specified in
the [license].

[etcher]: https://etcher.io
[SUPPORT]: https://github.com/resin-io/etcher/blob/master/SUPPORT.md
[CONTRIBUTING]: https://github.com/resin-io/etcher/blob/master/docs/CONTRIBUTING.md
[CLI]: https://github.com/resin-io/etcher/blob/master/docs/CLI.md
[USER-DOCUMENTATION]: https://github.com/resin-io/etcher/blob/master/docs/USER-DOCUMENTATION.md
[milestones]: https://github.com/resin-io/etcher/milestones
[newissue]: https://github.com/resin-io/etcher/issues/new
[license]: https://github.com/resin-io/etcher/blob/master/LICENSE
