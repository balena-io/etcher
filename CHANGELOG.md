# Change Log

All notable changes to this project will be documented in this file.
This project adheres to [Semantic Versioning](http://semver.org/).

## v1.0.0-beta.16 - 2016-10-28

### Features

- Use info icon instead of "SHOW FULL FILE NAME" in first step.
- Display image path base name as a tooltip on truncated image name.
- Add support for `etch` images.

### Fixes

- Fix Etcher leaving zombie processes behind in GNU/Linux.
- Prevent escaping issues during elevation by surrounding paths in double quotes.
- Fix "Unexpected end of JSON" error in Windows.
- Fix drag and drop not working anymore.
- Don't clear selection state when re-selecting an image.

### Misc

- Publish standalone Windows builds.

## v1.0.0-beta.15 - 2016-09-26

### Features

- Allow the user to disable auto-update notifications with an environment variable.
- Allow images to declare a recommended minimum drive size.

### Fixes

- Fix flashing never starting after elevation in GNU/Linux.
- Fix sporadic EPERM write errors on Windows.
- Fix incorrect validation errors when flashing bzip2 images.
- Fix `cscript is not recognised as an internal or external command` Windows error.

## v1.0.0-beta.14 - 2016-09-12

### Features

- Allow archive images to configure a certain amount of bytes to be zeroed out from the beginning of the drive when using bmaps.
- Make the "Need help?" link dynamically open the image support url.
- Add `.bmap` support.

### Fixes

- Don't clear the drive selection if clicking the "Retry" button.
- Fix "`modal.dismiss` is not a function" exception.
- Prevent `ENOSPC` if the drive capacity is equal to the image size.
- Prevent failed validation due to drive getting auto-mounted in GNU/Linux.
- Fix incorrect estimated entry sizes in certain ZIP archives.
- Show device id if device doesn't have an assigned drive letter in Windows.
- Fix `blkid: command not found` error in certain GNU/Linux distributions.

### Misc

- Upgrade `etcher-image-stream` to v4.3.0.
- Upgrade `drivelist` to v3.3.0.
- Improve speed when retrieving archive image metadata.
- Improve image full file name modal tooltip.

## v1.0.0-beta.13 - 2016-08-05

### Features

- Show "Unmounting..." while unmounting a drive.
- Perform drive auto-selection even when there is no selected image.

### Fixes

- Prevent selected drive from getting auto-removed when navigating back to the main screen from another screen.
- Fix new available drives not being recognised automatically in Windows.
- Fix application stuck at "Finishing".
- Display an error if no graphical polkit authentication agent was found.
- Only enable error reporting if running inside an `asar`.
- Fix "backdrop click" uncaught errors on modals.

### Misc

- Fix internal removable drives considered system drives in macOS Sierra.
- Upgrade `etcher-image-write` to v6.0.1.
- Upgrade `removedrive` to v1.0.0.

## v1.0.0-beta.12 - 2016-07-26

### Features

- Support rich image extensions.
- Add support for `raw` images.
- Display a nice alert ribbon if drive runs out of space.
- Validate the existence of the passed drive.
- Add an "unsafe" option to bypass drive protection.

### Fixes

- Escape quotes from image paths to prevent Bash errors on GNU/Linux and OS X.
- Check if drive is large enough using the final uncompressed size of the image.

### Misc

- Upgrade `drivelist` to v3.2.4.

## v1.0.0-beta.11 - 2016-07-17

### Features

- Set dialog default directory to the place where the AppImage was run from in GNU/Linux.

### Fixes

- Don't throw an "Invalid image" error if the extension is not in lowercase.
- Fix `ENOENT` error when selecting certain images with multiple extensions on GNU/Linux.
- Fix flashing not starting when an image name contains a space.
- Fix error when writing images containing parenthesis in GNU/Linux and OS X.
- Fix error when cancelling an elevation request.
- Fix incorrect ETA numbers in certain timezones.
- Fix state validation error when speed equals zero.
- Display `*.zip` in the supported images tooltip.
- Fix uncaught exception when showing the update notifier modal.

### Misc

- Upgrade `etcher-image-write` to v5.0.2.

## v1.0.0-beta.10 - 2016-06-27

### Features

- Add support for `dsk` images.
- Only elevate the writer process instead of the whole application.
- Make sure a drive is instantly deselected if its not available anymore.
- Make Etcher CLI `--robot` option output parseable JSON strings.

### Fixes

- Fix an error that prevented an AppImage from being directly ran as `root`.
- Ensure we pass the correct argument types to `electron.dialog.showErrorBox()`.
- Don't re-check for updates when navigating back to the main screen.
- Emit window progress even when not on the main screen.
- Improve aliasing of the striped progress button.
- Fix `EPERM` errors on Windows.

### Misc

- Add documentation for the Etcher CLI.
- Add a GitHub issue template.
- Open DevTools in "undocked" mode by default.

## v1.0.0-beta.9 - 2016-06-20

### Fixes

- Don't interpret image file name information between dots as image extensions.

## v1.0.0-beta.8 - 2016-06-15

### Features

- Display ETA during flash and check.
- Show an informative label if the drive is not large enough for the selected image.
- Show an informative label if the drive is locked (write protected).

### Fixes

- Prevent certain system drives to be detected as removable in GNU/Linux.
- Fix external resources not opening on GNU/Linux when the application is elevated.
- Don't show an unnecessary scroll bar in the update notifier modal.
- Prevent selection of invalid images by drag and drop.
- Fix `EPERM` errors on Windows on drives formatted with a GUID Partition Table.
- Prevent a very long image name from breaking the UI.

### Misc

- Write a document explaining Etcher's architecture.

## v1.0.0-beta.7 - 2016-05-26

### Features

- Add `gzip` compression support.
- Add `bzip2` compression support.
- Provide a GUI elevation dialog for GNU/Linux.

### Fixes

- Fix broken image drag and drop functionality.
- Prevent global shortcuts from interferring with another applications.
- Prevent re-activating the "Flash" button with the keybaord shortcuts when a flash is already in process.
- Fix certain non-removable Windows devices not being filtered out.
- Display non-mountable Windows drives in the drive selector.

### Misc

- Upgrade Electron to v1.1.1.
- Various improvements to the build system.

## v1.0.0-beta.6 - 2016-05-12

### Features

- Implement update notifier modal.
- Implement writing by forking the Etcher CLI as a child process.

### Fixes

- Prevent selection of drives that are not large enough for the selected image.

### Misc

- Remove implicit "Enable" from settings screen items.

## v1.0.0-beta.5 - 2016-05-04

### Features

- Add `xz` compression support.

### Fixes

- Improve "Select Image" supported file types label.
- Fix error that prevented the application to be elevated correctly on Windows.

### Misc

- Deprecate GNU/Linux `.tar.gz` installers in favor of AppImages.

## v1.0.0-beta.4 - 2016-04-22

### Features

- Generate [AppImage](http://appimage.org) packages for GNU/Linux.
- Add application version to footer, which links to the `CHANGELOG`.
- Allow to bypass elevation with an environment variable (`ETCHER_BYPASS_ELEVATION`).

### Fixes

- Improve drive selector modal.
- Add dashed underline stlying to footer links.

### Misc

- Upgrade Electron to v0.37.6.
- Integrate Etcher CLI in this git repository.

## v1.0.0-beta.3 - 2016-04-17

### Features

- Show drive name in drive selector modal.
- Add subtle hover styling to footer links.
- Implement OS notifications on completion.
- Allow to drag and drop an image to the first step.
- Add Etcher logo to application footer.
- Add "Change" button links below each step.
- Invert progress bar stripes during validation.

### Fixes

- Fix window contents being pushed below when opening the drive selector modal.
- Detect removal of selected drive.
- Detect MacBook SDCard readers in OS X.
- Improve removable drive detection on Windows.
- Keep one decimal in Windows drive sizes.
- Prevent error dialog not showing on malformed `Error` objects.
- Fix window being resizable on GNU/Linux.
- Hide drive selector modal if no available drives.
- Make drive selector modal react to drive auto-selection.
- Improve UX when attempting to re-selecta single available drive.
- Reset writer state on flash error.
- Fix `stream.push() after EOF` error when flashing unaligned images.

### Misc

- Compress Linux executables and libraries.
- Compress Windows DLLs.
- Make GNU/Linux binary lowercase.
- Replace all occurrences of "burn" with "flash".

## v1.0.0-beta.2 - 2016-04-07

### Features

- Implement a new drive selector modal widget.
- Log Etcher version in Mixpanel and TrackJS events to aid debugging.
- Implement write validation support.
- Add a setting to enable/disable write validation.

### Fixes

- Make sure window size is uniform between platforms.
- Fix "Use same image" button not preserving the image selection.
- Fix step vertical bars slight mis-alignment.
- Fix vertical spacing between success message and disk unmount notice label.
- Fix focus CSS style being persisted in the buttons after a click in some cases.
- Fix uncaught exception if no file was selected from a dialog.
- Fix external URL opening freezing applications in GNU/Linux.
- Fix code-signing issues in OS X in some systems.

### Misc

- Heavy general refactoring.

## v1.0.0-beta.1 - 2016-03-28

### Features

- Allow window to be dragged from anywhere.
- Add more application metadata to installation package.
- Setup code-signing for Windows.

### Fixes

- Fix uncaught error after rejecting elevation in OS X.
- Upgrade `drivelist` to v2.0.9, which includes various drive scanning improvements.
- Make sure error is logged if its trapped with an error dialog.
- Fix broken state when going to settings from the success screen.
- Fix `Cannot read property 'length' of undefined` frequent issue.
