Etcher User Documentation
=========================

This document contains application documented oriented to Etcher users.

Deactivate desktop shortcut prompt on GNU/Linux
-----------------------------------------------

This is a feature provided by [AppImages](appimage), where the applications
prompts the user to automatically register a desktop shortcut to easily access
the application.

To deactivate this feature, `touch` any of the files listed below:

- `$HOME/.local/share/appimagekit/no_desktopintegration`
- `/usr/share/appimagekit/no_desktopintegration`
- `/etc/appimagekit/no_desktopintegration`

[appimage]: http://appimage.org
