# Change Log

All notable changes to this project will be documented in this file.
This project adheres to [Semantic Versioning](http://semver.org/).

## [v1.0.0-beta.9] - 2016-06-20

### Changed

- Don't interpret image file name information between dots as image extensions.

## [v1.0.0-beta.8] - 2016-06-15

### Added

- Display ETA during flash and check.
- Write a document explaining Etcher's architecture.
- Show an informative label if the drive is not large enough for the selected image.
- Show an informative label if the drive is locked (write protected).

### Changed

- Prevent certain system drives to be detected as removable in GNU/Linux.
- Fix external resources not opening on GNU/Linux when the application is elevated.
- Don't show an unnecessary scroll bar in the update notifier modal.
- Prevent selection of invalid images by drag and drop.
- Fix `EPERM` errors on Windows on drives formatted with a GUID Partition Table.
- Prevent a very long image name from breaking the UI.

## [v1.0.0-beta.7] - 2016-05-26

### Added

- Add `gzip` compression support.
- Add `bzip2` compression support.
- Provide a GUI elevation dialog for GNU/Linux.

### Changed

- Upgrade Electron to v1.1.1.
- Fix broken image drag and drop functionality.
- Prevent global shortcuts from interferring with another applications.
- Prevent re-activating the "Flash" button with the keybaord shortcuts when a flash is already in process.
- Various improvements to the build system.
- Fix certain non-removable Windows devices not being filtered out.
- Display non-mountable Windows drives in the drive selector.

## [v1.0.0-beta.6] - 2016-05-12

### Added

- Implement update notifier modal.

### Changed

- Implement writing by forking the Etcher CLI as a child process.
- Prevent selection of drives that are not large enough for the selected image.

### Removed

- Remove implicit "Enable" from settings screen items.

## [v1.0.0-beta.5] - 2016-05-04

### Added

- Add `xz` compression support.

### Changed

- Improve "Select Image" supported file types label.
- Fix error that prevented the application to be elevated correctly on Windows.

### Removed

- Deprecate GNU/Linux `.tar.gz` installers in favor of AppImages.

## [v1.0.0-beta.4] - 2016-04-22

### Added

- Integrate Etcher CLI in this git repository.
- Generate [AppImage](http://appimage.org) packages for GNU/Linux.
- Add application version to footer, which links to the `CHANGELOG`.
- Allow to bypass elevation with an environment variable (`ETCHER_BYPASS_ELEVATION`).

### Changed

- Upgrade Electron to v0.37.6.
- Improve drive selector modal.
- Add dashed underline stlying to footer links.

## [v1.0.0-beta.3] - 2016-04-17

### Added

- Show drive name in drive selector modal.
- Add subtle hover styling to footer links.
- Implement OS notifications on completion.
- Allow to drag and drop an image to the first step.
- Add Etcher logo to application footer.
- Add "Change" button links below each step.

### Changed

- Invert progress bar stripes during validation.
- Fix window contents being pushed below when opening the drive selector modal.
- Detect removal of selected drive.
- Detect MacBook SDCard readers in OS X.
- Improve removable drive detection on Windows.
- Keep one decimal in Windows drive sizes.
- Prevent error dialog not showing on malformed `Error` objects.
- Fix window being resizable on GNU/Linux.
- Compress Linux executables and libraries.
- Compress Windows DLLs.
- Make GNU/Linux binary lowercase.
- Hide drive selector modal if no available drives.
- Replace all occurrences of "burn" with "flash".
- Make drive selector modal react to drive auto-selection.
- Improve UX when attempting to re-selecta single available drive.
- Reset writer state on flash error.
- Fix `stream.push() after EOF` error when flashing unaligned images.

## [v1.0.0-beta.2] - 2016-04-07

### Added

- Implement a new drive selector modal widget.
- Log Etcher version in Mixpanel and TrackJS events to aid debugging.
- Implement write validation support.
- Add a setting to enable/disable write validation.

### Changed

- Heavy general refactoring.
- Make sure window size is uniform between platforms.
- Fix "Use same image" button not preserving the image selection.
- Fix step vertical bars slight mis-alignment.
- Fix vertical spacing between success message and disk unmount notice label.
- Fix focus CSS style being persisted in the buttons after a click in some cases.
- Fix uncaught exception if no file was selected from a dialog.
- Fix external URL opening freezing applications in GNU/Linux.
- Fix code-signing issues in OS X in some systems.

### Removed

- Remove drive selector dropdown.

## [v1.0.0-beta.1] - 2016-03-28

### Added

- Allow window to be dragged from anywhere.
- Add more application metadata to installation package.
- Setup code-signing for Windows.

### Changed

- Fix uncaught error after rejecting elevation in OS X.
- Upgrade `drivelist` to v2.0.9, which includes various drive scanning improvements.
- Make sure error is logged if its trapped with an error dialog.
- Fix broken state when going to settings from the success screen.
- Fix `Cannot read property 'length' of undefined` frequent issue.

[v1.0.0-beta.9]: https://github.com/resin-io/etcher/compare/v1.0.0-beta.8...v1.0.0-beta.9
[v1.0.0-beta.8]: https://github.com/resin-io/etcher/compare/v1.0.0-beta.7...v1.0.0-beta.8
[v1.0.0-beta.7]: https://github.com/resin-io/etcher/compare/v1.0.0-beta.6...v1.0.0-beta.7
[v1.0.0-beta.6]: https://github.com/resin-io/etcher/compare/v1.0.0-beta.5...v1.0.0-beta.6
[v1.0.0-beta.5]: https://github.com/resin-io/etcher/compare/v1.0.0-beta.4...v1.0.0-beta.5
[v1.0.0-beta.4]: https://github.com/resin-io/etcher/compare/v1.0.0-beta.3...v1.0.0-beta.4
[v1.0.0-beta.3]: https://github.com/resin-io/etcher/compare/v1.0.0-beta.2...v1.0.0-beta.3
[v1.0.0-beta.2]: https://github.com/resin-io/etcher/compare/v1.0.0-beta.1...v1.0.0-beta.2
[v1.0.0-beta.1]: https://github.com/resin-io/etcher/compare/v1.0.0-beta.0...v1.0.0-beta.1
