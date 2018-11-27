Etcher
======

> Flash OS images to SD cards & USB drives, safely and easily.

Etcher is a powerful OS image flasher built with web technologies to ensure
flashing an SDCard or USB drive is a pleasant and safe experience. It protects
you from accidentally writing to your hard-drives, ensures every byte of data
was written correctly and much more.

[![Current Release](https://img.shields.io/github/release/balena-io/etcher.svg?style=flat-square)](https://etcher.io)
![License](https://img.shields.io/github/license/balena-io/etcher.svg?style=flat-square)
[![Travis CI status](https://img.shields.io/travis/balena-io/etcher/master.svg?style=flat-square&label=linux)](https://travis-ci.org/balena-io/etcher/branches)
[![AppVeyor status](https://img.shields.io/appveyor/ci/balena-io/etcher/master.svg?style=flat-square&label=windows)](https://ci.appveyor.com/project/balena-io/etcher/branch/master)
[![Dependency status](https://img.shields.io/david/balena-io/etcher.svg?style=flat-square)](https://david-dm.org/balena-io/etcher)
[![Balena.io Forums](https://img.shields.io/discourse/https/forums.balena.io/topics.svg?style=flat-square&label=balena.io%20forums)](https://forums.balena.io/c/etcher)
[![Stories in Progress](https://img.shields.io/waffle/label/balena-io/etcher/in%20progress.svg?style=flat-square)](https://waffle.io/balena-io/etcher)

***

[**Download**][etcher] | [**Support**][SUPPORT] | [**Documentation**][USER-DOCUMENTATION] | [**Contributing**][CONTRIBUTING] | [**Roadmap**][milestones] | [**CLI**][CLI]

![Etcher](https://raw.githubusercontent.com/balena-io/etcher/master/screenshot.png)

Supported Operating Systems
---------------------------

- Linux (most distros)
- macOS 10.9 and later
- Microsoft Windows 7 and later

Note that Etcher will run on any platform officially supported by
[Electron][electron]. Read more in their
[documentation][electron-supported-platforms].

Installers
----------

Refer to the [downloads page][etcher] for the latest pre-made
installers for all supported operating systems.

#### Debian and Ubuntu based Package Repository (GNU/Linux x86/x64)

1. Add Etcher debian repository:

    ```
    echo "deb https://deb.etcher.io stable etcher" | sudo tee /etc/apt/sources.list.d/etcher.list
    ```

2. Trust Bintray.com's GPG key:

    ```sh
    sudo apt-key adv --keyserver keyserver.ubuntu.com --recv-keys 379CE192D401AB61
    ```

3. Update and install:

    ```sh
    sudo apt-get update
    sudo apt-get install etcher-electron
    ```

##### Uninstall

```sh
sudo apt-get remove etcher-electron
sudo rm /etc/apt/sources.list.d/etcher.list
sudo apt-get update
```
#### Redhat (RHEL) and Fedora based Package Repository (GNU/Linux x86/x64)

1. Add Etcher rpm repository:

    ```sh
    sudo wget https://etcher.io/static/etcher-rpm.repo -O /etc/yum.repos.d/etcher-rpm.repo
    ```

2. Update and install:

    ```sh
    sudo yum install -y etcher-electron
    ```
    or
    ```sh
    sudo dnf install -y etcher-electron
    ```

##### Uninstall

```
sudo yum remove -y etcher-electron
sudo rm /etc/yum.repos.d/etcher-rpm.repo
sudo yum clean all
sudo yum makecache fast
```
or
```
sudo dnf remove -y etcher-electron
sudo rm /etc/yum.repos.d/etcher-rpm.repo
sudo dnf clean all
sudo dnf makecache
```

#### Solus (GNU/Linux x64)

```
sudo eopkg it etcher
```

##### Uninstall

```
+sudo eopkg rm etcher
```

#### Brew Cask (macOS)

Note that the Etcher Cask has to be updated manually to point to new versions,
so it might not refer to the latest version immediately after an Etcher
release.

```sh
brew cask install balenaetcher
```

##### Uninstall

```sh
brew cask uninstall balenaetcher
```

#### Chocolatey (Windows)

This package is maintained by [@majkinetor](https://github.com/majkinetor), and
is kept up to date automatically.

```sh
choco install etcher
```

##### Uninstall

```
choco uninstall etcher
```

Support
-------

If you're having any problem, please [raise an issue][newissue] on GitHub and
the balena.io team will be happy to help.

License
-------

Etcher is free software, and may be redistributed under the terms specified in
the [license].

[etcher]: https://etcher.io
[electron]: http://electron.atom.io
[electron-supported-platforms]: http://electron.atom.io/docs/tutorial/supported-platforms/
[SUPPORT]: https://github.com/balena-io/etcher/blob/master/SUPPORT.md
[CONTRIBUTING]: https://github.com/balena-io/etcher/blob/master/docs/CONTRIBUTING.md
[CLI]: https://github.com/balena-io/etcher/blob/master/docs/CLI.md
[USER-DOCUMENTATION]: https://github.com/balena-io/etcher/blob/master/docs/USER-DOCUMENTATION.md
[milestones]: https://github.com/balena-io/etcher/milestones
[newissue]: https://github.com/balena-io/etcher/issues/new
[license]: https://github.com/balena-io/etcher/blob/master/LICENSE
