Contributing Guide
==================

Thanks for your interest in contributing to this project! This document aims to
serve as a friendly guide for making your first contribution.

High-level Etcher overview
--------------------------

Make sure you checkout our [ARCHITECTURE.md][ARCHITECTURE] guide, which aims to
explain how all the pieces fit together.

Developing
----------

### Prerequisites

#### Common

- [NodeJS](https://nodejs.org) (at least v6.11) (ex. v16.13.0) You should better check 'Automatically', then 'windows-build-tools' is installed.
- [npm](https://www.npmjs.com/) (version 6.7) (ex. v8.1.0 --> v7.24.2) `npm install @7 -g`
- [Python](https://www.python.org) (ex. v3.9.7) Please add `%PATH%` to python.exe and scripts folder.
- [jq](https://stedolan.github.io/jq/) (ex. v1.6) Please rename to jq.exe and add `%PATH%` to jq folder.
- [curl](https://curl.haxx.se/) (ex. v7.79.1)

You might need to run this with `sudo` or administrator permissions.

#### Windows

- [NSIS v2.51](https://nsis.sourceforge.io/Main_Page) (v3.x won't work)
- [MinGW](https://ja.osdn.net/projects/mingw/) (ex. mingw-get-setup.exe)
  The following MinGW packages are required (from Installation Manager):
  - `msys-make`
  - `msys-unzip`
  - `msys-zip`
  - `msys-bash`
  - `msys-coreutils`
- Development tools
  (see https://www.npmjs.com/package/winusb-driver-generator and https://docs.microsoft.com/en-us/windows-hardware/drivers/other-wdk-downloads)
  - [Visual Studio Community](https://visualstudio.microsoft.com/ja/vs/older-downloads/) (free) (other editions, like Professional and Enterprise, should work too)
    (ex. https://visualstudio.microsoft.com/thank-you-downloading-visual-studio/?sku=Community&rel=16)

    **NOTE:** Visual Studio doesn't install C++ by default. You have to rerun the
    setup, select "Modify" and then check `Visual C++ -> Common Tools for Visual
    C++` (see http://stackoverflow.com/a/31955339)

    (You might need to `npm config set msvs_version YYYY` for node-gyp to correctly detect
    the version of Visual Studio you're using.)

  - [Windows SDK](https://developer.microsoft.com/en-us/windows/downloads/windows-sdk/)
  - [Windows WDK](https://docs.microsoft.com/en-us/windows-hardware/drivers/other-wdk-downloads)


#### macOS

- [Xcode](https://developer.apple.com/xcode/)

It's not enough to have [Xcode Command Line Tools] installed. Xcode must be installed
as well.

#### Linux

- `libudev-dev` for libusb (install with `sudo apt install libudev-dev` for example)

### Cloning the project

```sh
git clone --recursive https://github.com/rdbox-intec/rdboxGARIBAN2
cd rdboxGARIBAN2
```
**NOTE:** 
If you see the error "The file contains characters that cannot be displayed. 
Save the file in Unicode format to prevent data loss.", 
Delete the current directory and do the following before cloning.
[Control Panel]-[Area]-[Management]
Beta Worldwide Language Support (Use Unicode UTF-8): Checked

### Installing python packages

```sh
pip install -r requirements.txt
```

### Installing npm dependencies

```sh
make distclean
npm install node-gyp --save
npm uninstall node-pre-gyp --save
npm install @mapbox/node-pre-gyp --save
```

**NOTE:** Please add `%PATH%` to @mapbox folder.

```sh
npm install
```

**NOTE:** Please make use of the following command to install npm dependencies rather
than simply running `npm install` given that we need to do extra configuration
to make sure native dependencies are correctly compiled for Electron, otherwise
the application might not run successfully.

If you're on Windows, **run the command from the _Developer Command Prompt for
VS2015_**, to ensure all Visual Studio command utilities are available in the
`%PATH%`.

```sh
make electron-develop
```

### Running the application

#### GUI

```sh
# Build the GUI
npm run webpack
# Start Electron
npm start
```

Testing
-------

To run the test suite, run the following command:

```sh
npm test
```

Given the nature of this application, not everything can be unit tested. For
example:

- The writing operating on real raw devices.
- Platform inconsistencies.
- Style changes.
- Artwork.

We encourage our contributors to test the application on as many operating
systems as they can before sending a pull request.

*The test suite is run automatically by CI servers when you send a pull
request.*

We also rely on various `make` targets to perform some common tasks:

- `make lint`: Run the linter.
- `make sass`: Compile SCSS files.

We make use of [EditorConfig] to communicate indentation, line endings and
other text editing default. We encourage you to install the relevant plugin in
your text editor of choice to avoid having to fix any issues during the review
process.

Updating a dependency
---------------------

Given we use [npm shrinkwrap][shrinkwrap], we have to take extra steps to make
sure the `npm-shrinkwrap.json` file gets updated correctly when we update a
dependency.

Use the following steps to ensure everything goes flawlessly:

- Run `make electron-develop` to ensure you don't have extraneous dependencies
  you might have brought during development, or you are running older
  dependencies because you come from another branch or reference.

- Install the new version of the dependency. For example: `npm install --save
  <package>@<version>`. This will update the `npm-shrinkwrap.json` file.

- Commit *both* `package.json` and `npm-shrinkwrap.json`.

Diffing Binaries
----------------

Binary files are tagged as "binary" in the `.gitattributes` file, but also have
a `diff=hex` tag, which allows you to see hexdump-style diffs for binaries,
if you add the following to either your global or repository-local git config:

```sh
$ git config diff.hex.textconv hexdump
$ git config diff.hex.binary true
```

And global, respectively:

```sh
$ git config --global diff.hex.textconv hexdump
$ git config --global diff.hex.binary true
```

If you don't have `hexdump` available on your platform,
you can try [hxd], which is also a bit faster.

Commit Guidelines
-----------------

See [COMMIT-GUIDELINES.md][COMMIT-GUIDELINES] for a thorough guide on how to
write commit messages.

Sending a pull request
----------------------

When sending a pull request, consider the following guidelines:

- Write a concise commit message explaining your changes.

- If applies, write more descriptive information in the commit body.

- Mention the operating systems with the corresponding versions in which you
tested your changes.

- If your change affects the visuals of the application, consider attaching a
screenshot.

- Refer to the issue/s your pull request fixes, so they're closed automatically
when your pull request is merged.

- Write a descriptive pull request title.

- Squash commits when possible, for example, when committing review changes.

Before your pull request can be merged, the following conditions must hold:

- The linter doesn't throw any warning.

- All the tests pass.

- The coding style aligns with the project's convention.

- Your changes are confirmed to be working in recent versions of the operating
systems we support.

Don't hesitate to get in touch if you have any questions or need any help!

[ARCHITECTURE]: https://github.com/balena-io/etcher/blob/master/docs/ARCHITECTURE.md
[COMMIT-GUIDELINES]: https://github.com/balena-io/etcher/blob/master/docs/COMMIT-GUIDELINES.md
[EditorConfig]: http://editorconfig.org
[shrinkwrap]: https://docs.npmjs.com/cli/shrinkwrap
[hxd]: https://github.com/jhermsmeier/hxd
[Xcode Command Line Tools]: https://developer.apple.com/library/content/technotes/tn2339/_index.html
