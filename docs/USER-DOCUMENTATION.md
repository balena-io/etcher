Etcher User Documentation
=========================

This document contains how-tos and FAQs oriented to Etcher users.

Why is my drive not bootable?
-----------------------------

Etcher copies images to drives byte by byte, without doing any transformation
to the final device, which means images that require special treatment to be
made bootable, like Windows images, will not work out of the box. In these
cases, the general advice is to use software specific to those kind of
images, usually available from the image publishers themselves.

Images known to require special treatment:

- Microsoft Windows (use [Windows USB/DVD Download Tool][windows-usb-tool], or
  [Rufus][rufus]).

- Windows 10 IoT (use the [Windows 10 IoT Core Dashboard][windows-iot-dashboard])

How can I configure persistent storage?
---------------------------------------

Some programs, usually oriented at making GNU/Linux live USB drives, include an
option to set persistent storage. This is currently not supported by Etcher, so
if you require this functionality, we advise to fallback to
[UNetbootin][unetbootin].

Deactivate desktop shortcut prompt on GNU/Linux
-----------------------------------------------

This is a feature provided by [AppImages](appimage), where the applications
prompts the user to automatically register a desktop shortcut to easily access
the application.

To deactivate this feature, `touch` any of the files listed below:

- `$HOME/.local/share/appimagekit/no_desktopintegration`
- `/usr/share/appimagekit/no_desktopintegration`
- `/etc/appimagekit/no_desktopintegration`

Alternatively, set the `SKIP` environment variable before executing the
AppImage:

```sh
SKIP=1 ./Etcher-linux-<arch>.AppImage
```

Flashing Ubuntu ISOs
--------------------

Ubuntu images (and potentially some other related GNU/Linux distributions) have
a peculiar format that allows the image to boot without any further
modification from both CDs and USB drives.

A consequence of this enhancement is that some programs, like `parted` get
confused about the drive's format and partition table, printing warnings such
as:

> /dev/xxx contains GPT signatures, indicating that it has a GPT table.
> However, it does not have a valid fake msdos partition table, as it should.
> Perhaps it was corrupted -- possibly by a program that doesn't understand GPT
> partition tables.  Or perhaps you deleted the GPT table, and are now using an
> msdos partition table.  Is this a GPT partition table?  Both the primary and
> backup GPT tables are corrupt.  Try making a fresh table, and using Parted's
> rescue feature to recover partitions.

***

> Warning: The driver descriptor says the physical block size is 2048 bytes,
> but Linux says it is 512 bytes.

All these warnings are **safe to ignore**, and your drive should be able to
boot without any problems.

Refer to [the following message from Ubuntu's mailing
list](https://lists.ubuntu.com/archives/ubuntu-devel/2011-June/033495.html) if
you want to learn more.

Running on Wayland
------------------

Electron is based on Gtk2, which can't run natively on Wayland. Fortunately,
the [XWayland Server][xwayland] provides backwards compatibility to run *any* X
client on Wayland, including Etcher.

This usually works out of the box on mainstream GNU/Linux distributions that
properly support Wayland. If it doesn't, make sure the `xwayland.so` module is
being loaded by declaring it in your [weston.ini]:

```
[core]
modules=xwayland.so
```

Runtime GNU/Linux dependencies
------------------------------

This entry aims to provide an up to date list of runtime dependencies needed to
run Etcher on a GNU/Linux system.

### Electron specific

> See [brightray's gyp file](https://github.com/electron/brightray/blob/master/brightray.gyp#L4)

- gtk+-2.0
- dbus-1
- x11
- xi
- xcursor
- xdamage
- xrandr
- xcomposite
- xext
- xfixes
- xrender
- xtst
- xscrnsaver
- gconf-2.0
- gmodule-2.0
- nss

### Optional dependencies:

- libnotify (for notifications)
- libspeechd (for text-to-speech)

### Etcher specific:

- liblzma (for xz decompression)

Simulate an update alert
------------------------

You can set the `ETCHER_FAKE_S3_LATEST_VERSION` environment variable to a valid
semver version (greater than the current version) to trick the application into
thinking that what you put there is the latest available version, therefore
causing the update notification dialog to be presented at startup.

Note that the value of the variable will be ignored if it doesn't match the
release type of the current application version. For example, setting the
variable to a production version (e.g. `ETCHER_FAKE_S3_LATEST_VERSION=2.0.0`)
will be ignored if you're running a snapshot build, and vice-versa.

See [`PUBLISHING.md`][publishing] for more details about release types.

Recovering broken drives
------------------------

Sometimes, things might go wrong, and you end up with a half-flashed drive that
is unusable by your operating systems, and common graphical tools might even
refuse to get it back to a normal state.

To solve these kinds of problems, we've collected a list of fail-proof methods
to completely erase your drive in major operating systems.

### Windows

In Windows, we'll use [diskpart], a command line utility tool that comes
pre-installed in all modern Windows versions.

- Open `cmd.exe` from either the list of all installed applications, or from
  the "Run..." dialog usually accessible by pressing Ctrl+X.

- Type `diskpart.exe` and press "Enter". You'll be asked to provide
  administrator permissions, and a new prompt window will appear. The following
  commands should be run **in the new window**.

- Run `list disk` to list the available drives. Take note of the number id that
  identifies the drive you want to clean.

- Run `select disk N`, where `N` corresponds to the id from the previous step.

- Run `clean`. This command will completely clean your drive by erasing any
  existent filesystem.

### OS X

Run the following command in `Terminal.app`, replacing `N` by the corresponding
disk number, which you can find by running `diskutil list`:

```sh
diskutil eraseDisk free UNTITLED /dev/diskN
```

### GNU/Linux

Make sure the drive is unmounted (`umount /dev/xxx`), and run the following
command as `root`, replacing `xxx` by your actual device path:

```sh
dd if=/dev/zero of=/dev/xxx bs=512 count=1 conv=notrunc
```

"No polkit authentication agent found" error in GNU/Linux
----------------------------------------------------------

Etcher requires an available [polkit authentication
agent](https://wiki.archlinux.org/index.php/Polkit#Authentication_agents) in
your system in order to show a secure password prompt dialog to perform
elevation. Make sure you have one installed for the desktop environment of your
choice.

Running in older macOS versions
-------------------------------

Etcher GUI is based on the [Electron][electron] framework, [which only supports
macOS 10.9 and newer versions][electron-supported-platforms].

You can however, run the [Etcher CLI][etcher-cli], which should work in older
platforms.

[resin.io]: https://resin.io
[appimage]: http://appimage.org
[xwayland]: https://wayland.freedesktop.org/xserver.html
[weston.ini]: http://manpages.ubuntu.com/manpages/wily/man5/weston.ini.5.html
[diskpart]: https://technet.microsoft.com/en-us/library/cc770877(v=ws.11).aspx
[electron]: http://electron.atom.io
[electron-supported-platforms]: https://github.com/electron/electron/blob/master/docs/tutorial/supported-platforms.md
[etcher-cli]: https://github.com/resin-io/etcher/blob/master/docs/CLI.md
[publishing]: https://github.com/resin-io/etcher/blob/master/docs/PUBLISHING.md
[windows-usb-tool]: https://www.microsoft.com/en-us/download/windows-usb-dvd-download-tool
[rufus]: https://rufus.akeo.ie
[unetbootin]: https://unetbootin.github.io
[windows-iot-dashboard]: https://developer.microsoft.com/en-us/windows/iot/downloads
