# Etcher

> Flash OS images to SD cards & USB drives, safely and easily.

Etcher is a powerful OS image flasher built with web technologies to ensure
flashing an SDCard or USB drive is a pleasant and safe experience. It protects
you from accidentally writing to your hard-drives, ensures every byte of data
was written correctly and much more. It can also flash directly Raspberry Pi devices that support the usbboot protocol

[![Current Release](https://img.shields.io/github/release/balena-io/etcher.svg?style=flat-square)](https://balena.io/etcher)
[![License](https://img.shields.io/github/license/balena-io/etcher.svg?style=flat-square)](https://github.com/balena-io/etcher/blob/master/LICENSE)
[![Dependency status](https://img.shields.io/david/balena-io/etcher.svg?style=flat-square)](https://david-dm.org/balena-io/etcher)
[![Balena.io Forums](https://img.shields.io/discourse/https/forums.balena.io/topics.svg?style=flat-square&label=balena.io%20forums)](https://forums.balena.io/c/etcher)

***

[**Download**][etcher] | [**Support**][SUPPORT] | [**Documentation**][USER-DOCUMENTATION] | [**Contributing**][CONTRIBUTING] | [**Roadmap**][milestones]

## Supported Operating Systems

- Linux (most distros)
- macOS 10.10 (Yosemite) and later
- Microsoft Windows 7 and later

Note that Etcher will run on any platform officially supported by
[Electron][electron]. Read more in their
[documentation][electron-supported-platforms].

## Installers

Refer to the [downloads page][etcher] for the latest pre-made
installers for all supported operating systems.

#### Debian and Ubuntu based Package Repository (GNU/Linux x86/x64)

1. Add Etcher debian repository:

    ```sh
    echo "deb https://deb.etcher.io stable etcher" | sudo tee /etc/apt/sources.list.d/balena-etcher.list
    ```

2. Trust Bintray.com's GPG key:

    ```sh
    sudo apt-key adv --keyserver hkps://keyserver.ubuntu.com:443 --recv-keys 379CE192D401AB61
    ```

3. Update and install:

    ```sh
    sudo apt-get update
    sudo apt-get install balena-etcher-electron
    ```

##### Uninstall

```sh
sudo apt-get remove balena-etcher-electron
sudo rm /etc/apt/sources.list.d/balena-etcher.list
sudo apt-get update
```
#### Redhat (RHEL) and Fedora based Package Repository (GNU/Linux x86/x64)

1. Add Etcher rpm repository:

    ```sh
    sudo wget https://balena.io/etcher/static/etcher-rpm.repo -O /etc/yum.repos.d/etcher-rpm.repo
    ```

2. Update and install:

    ```sh
    sudo yum install -y balena-etcher-electron
    ```
    or
    ```sh
    sudo dnf install -y balena-etcher-electron
    ```

##### Uninstall

```sh
sudo yum remove -y balena-etcher-electron
sudo rm /etc/yum.repos.d/etcher-rpm.repo
sudo yum clean all
sudo yum makecache fast
```
or
```sh
sudo dnf remove -y balena-etcher-electron
sudo rm /etc/yum.repos.d/etcher-rpm.repo
sudo dnf clean all
sudo dnf makecache
```

#### Solus (GNU/Linux x64)

```sh
sudo eopkg it etcher
```

##### Uninstall

```sh
sudo eopkg rm etcher
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

```sh
choco uninstall etcher
```

## Support

If you're having any problem, please [raise an issue][newissue] on GitHub and
the balena.io team will be happy to help.

## License

Etcher is free software, and may be redistributed under the terms specified in
the [license].

[etcher]: https://balena.io/etcher
[electron]: https://electronjs.org/
[electron-supported-platforms]: https://electronjs.org/docs/tutorial/support#supported-platforms
[SUPPORT]: https://github.com/balena-io/etcher/blob/master/SUPPORT.md
[CONTRIBUTING]: https://github.com/balena-io/etcher/blob/master/docs/CONTRIBUTING.md
[USER-DOCUMENTATION]: https://github.com/balena-io/etcher/blob/master/docs/USER-DOCUMENTATION.md
[milestones]: https://github.com/balena-io/etcher/milestones
[newissue]: https://github.com/balena-io/etcher/issues/new
[license]: https://github.com/balena-io/etcher/blob/master/LICENSE
