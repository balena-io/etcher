Etcher User Documentation
=========================

This document contains how-tos and FAQs oriented to Etcher users.

Deactivate desktop shortcut prompt on GNU/Linux
-----------------------------------------------

This is a feature provided by [AppImages](appimage), where the applications
prompts the user to automatically register a desktop shortcut to easily access
the application.

To deactivate this feature, `touch` any of the files listed below:

- `$HOME/.local/share/appimagekit/no_desktopintegration`
- `/usr/share/appimagekit/no_desktopintegration`
- `/etc/appimagekit/no_desktopintegration`

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

Disable update notifications
----------------------------

You can disable update notifications, which can be useful when running Etcher
outside a common desktop environment (like in a [Resin.io][resin.io]
application), by setting the `ETCHER_DISABLE_UPDATES` environment variable.

In GNU/Linux and Mac OS X:

```sh
export ETCHER_DISABLE_UPDATES=1
```

In Windows:

```sh
set ETCHER_DISABLE_UPDATES=1
```

[resin.io]: https://resin.io
[appimage]: http://appimage.org
[xwayland]: https://wayland.freedesktop.org/xserver.html
[weston.ini]: http://manpages.ubuntu.com/manpages/wily/man5/weston.ini.5.html
