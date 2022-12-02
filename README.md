# Etcher

> Flash OS images to SD cards & USB drives, safely and easily.

Etcher is a powerful OS image flasher built with web technologies to ensure
flashing an SDCard or USB drive is a pleasant and safe experience. It protects
you from accidentally writing to your hard-drives, ensures every byte of data
was written correctly, and much more. It can also directly flash Raspberry Pi devices that support [USB device boot mode](https://www.raspberrypi.com/documentation/computers/raspberry-pi.html#usb-device-boot-mode).

[![Current Release](https://img.shields.io/github/release/balena-io/etcher.svg?style=flat-square)](https://balena.io/etcher)
[![License](https://img.shields.io/github/license/balena-io/etcher.svg?style=flat-square)](https://github.com/balena-io/etcher/blob/master/LICENSE)
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

## Packages

> [![Hosted By: Cloudsmith](https://img.shields.io/badge/OSS%20hosting%20by-cloudsmith-blue?logo=cloudsmith&style=for-the-badge)](https://cloudsmith.com) \
Package repository hosting is graciously provided by  [Cloudsmith](https://cloudsmith.com).
Cloudsmith is the only fully hosted, cloud-native, universal package management solution, that
enables your organization to create, store and share packages in any format, to any place, with total
confidence.

#### Debian and Ubuntu based Package Repository (GNU/Linux x86/x64)

> Detailed or alternative steps in the [instructions by Cloudsmith](https://cloudsmith.io/~balena/repos/etcher/setup/#formats-deb)

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

#### Redhat (RHEL) and Fedora-based Package Repository (GNU/Linux x86/x64)

> Detailed or alternative steps in the [instructions by Cloudsmith](https://cloudsmith.io/~balena/repos/etcher/setup/#formats-rpm)


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

#### OpenSUSE LEAP & Tumbleweed install (zypper)

1. Add the repo

   ```sh
   curl -1sLf \
   'https://dl.cloudsmith.io/public/balena/etcher/setup.rpm.sh' \
   | sudo -E bash
   ```
2. Update and install

   ```sh
   sudo zypper up
   sudo zypper install balena-etcher-electron
   ```

##### Uninstall

```sh
sudo zypper rm balena-etcher-electron
# remove the repo
sudo zypper rr balena-etcher
sudo zypper rr balena-etcher-source
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


