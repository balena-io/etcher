# Etcher

> Flash OS images to SD cards & USB drives, safely and easily.

Etcher is a powerful OS image flasher built with web technologies to ensure
flashing an SDCard or USB drive is a pleasant and safe experience. It protects
you from accidentally writing to your hard-drives, ensures every byte of data
was written correctly, and much more. It can also directly flash Raspberry Pi devices that support [USB device boot mode](https://www.raspberrypi.org/documentation/hardware/raspberrypi/bootmodes/device.md).

[![Current Release](https://img.shields.io/github/release/balena-io/etcher.svg?style=flat-square)](https://balena.io/etcher)
[![License](https://img.shields.io/github/license/balena-io/etcher.svg?style=flat-square)](https://github.com/balena-io/etcher/blob/master/LICENSE)
[![Dependency status](https://img.shields.io/david/balena-io/etcher.svg?style=flat-square)](https://david-dm.org/balena-io/etcher)
[![Balena.io Forums](https://img.shields.io/discourse/https/forums.balena.io/topics.svg?style=flat-square&label=balena.io%20forums)](https://forums.balena.io/c/etcher)

---

[**Download**][etcher] | [**Support**][support] | [**Documentation**][user-documentation] | [**Contributing**][contributing] | [**Roadmap**][milestones]

## Supported Operating Systems

- Linux (most distros)
- macOS 10.10 (Yosemite) and later
- Microsoft Windows 7 and later

**Note**: Etcher will run on any platform officially supported by
[Electron][electron]. Read more in their
[documentation][electron-supported-platforms].

## Installers

Refer to the [downloads page][etcher] for the latest pre-made
installers for all supported operating systems.

> Note: Our deb and rpm packages are now hosted on [Cloudsmith](https://cloudsmith.com)!

#### Debian and Ubuntu based Package Repository (GNU/Linux x86/x64)

1. Add Etcher Debian repository:

   ```sh
   curl -1sLf \
      'https://dl.cloudsmith.io/public/balena/etcher/setup.deb.sh' \
      | sudo -E bash
   ```

2. Update and install:

   ```sh
   sudo apt-get update
   sudo apt-get install balena-etcher-electron
   ```

##### Uninstall

```sh
sudo apt-get remove balena-etcher-electron
rm /etc/apt/sources.list.d/balena-etcher.list
apt-get clean
rm -rf /var/lib/apt/lists/*
apt-get update
```

##### OpenSUSE LEAP & Tumbleweed install

```sh
curl -1sLf \
  'https://dl.cloudsmith.io/public/balena/etcher/setup.rpm.sh' \
  | sudo -E bash
```

##### Uninstall

```sh
zypper rr balena-etcher
zypper rr balena-etcher-source
```

#### Redhat (RHEL) and Fedora-based Package Repository (GNU/Linux x86/x64)

##### DNF

1. Add Etcher rpm repository:

   ```sh
   curl -1sLf \
      'https://dl.cloudsmith.io/public/balena/etcher/setup.rpm.sh' \
      | sudo -E bash
   ```

2. Update and install:

   ```sh
   sudo dnf install -y balena-etcher-electron
   ```

###### Uninstall

```sh
rm /etc/yum.repos.d/balena-etcher.repo
rm /etc/yum.repos.d/balena-etcher-source.repo
```

##### Yum

1. Add Etcher rpm repository:

   ```sh
   curl -1sLf \
      'https://dl.cloudsmith.io/public/balena/etcher/setup.rpm.sh' \
      | sudo -E bash
   ```

2. Update and install:

   ```sh
   sudo yum install -y balena-etcher-electron
   ```

###### Uninstall

```sh
sudo yum remove -y balena-etcher-electron
rm /etc/yum.repos.d/balena-etcher.repo
rm /etc/yum.repos.d/balena-etcher-source.repo
```

#### Solus (GNU/Linux x64)

```sh
sudo eopkg it etcher
```

##### Uninstall

```sh
sudo eopkg rm etcher
```

#### Arch/Manjaro Linux (GNU/Linux x64)

Etcher is offered through the Arch User Repository and can be installed on both Manjaro and Arch systems. You can compile it from the source code in this repository using [`balena-etcher`](https://aur.archlinux.org/packages/balena-etcher/). The following example uses a common AUR helper to install the latest release:

```sh
yay -S balena-etcher
```

##### Uninstall

```sh
yay -R balena-etcher
```

#### Brew (macOS)

**Note**: Etcher has to be updated manually to point to new versions,
so it might not refer to the latest version immediately after an Etcher
release.

```sh
brew install balenaetcher
```

##### Uninstall

```sh
brew uninstall balenaetcher
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

If you're having any problem, please [raise an issue][newissue] on GitHub, and
the balena.io team will be happy to help.

## License

Etcher is free software and may be redistributed under the terms specified in
the [license].

[etcher]: https://balena.io/etcher
[electron]: https://electronjs.org/
[electron-supported-platforms]: https://electronjs.org/docs/tutorial/support#supported-platforms
[support]: https://github.com/balena-io/etcher/blob/master/SUPPORT.md
[contributing]: https://github.com/balena-io/etcher/blob/master/docs/CONTRIBUTING.md
[user-documentation]: https://github.com/balena-io/etcher/blob/master/docs/USER-DOCUMENTATION.md
[milestones]: https://github.com/balena-io/etcher/milestones
[newissue]: https://github.com/balena-io/etcher/issues/new
[license]: https://github.com/balena-io/etcher/blob/master/LICENSE
