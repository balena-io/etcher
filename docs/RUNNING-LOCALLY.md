Running locally
===============

This document aims to serve as a guide to get Etcher running locally on your
development machine.

Prerequisites
-------------

### Common

- [NodeJS](https://nodejs.org) (at least v6)
- [Bower](http://bower.io)
- [UPX](http://upx.sourceforge.net)
- [Python](https://www.python.org)
- [SCSS Lint](https://github.com/brigade/scss-lint/)
- [jq](https://stedolan.github.io/jq/)
- [Asar](https://github.com/electron/asar)
- [Codespell](https://github.com/lucasdemarchi/codespell)

### Windows

- [Rimraf](https://github.com/isaacs/rimraf)
- [NSIS v2.51](http://nsis.sourceforge.net/Main_Page) (v3.x won't work)
- [Visual Studio Community 2015](https://www.microsoft.com/en-us/download/details.aspx?id=48146) (free) (other editions, like Professional and Enterprise, should work too)
- [7z](http://www.7-zip.org) (command line version)
- [MinGW](http://www.mingw.org)

The following MinGW packages are required:

- `msys-make`
- `msys-unzip`
- `msys-wget`
- `msys-bash`
- `msys-coreutils`

### OS X

- [XCode](https://developer.apple.com/xcode/)
- [afsctool](https://brkirch.wordpress.com/afsctool/)

Cloning the project
-------------------

```sh
git clone https://github.com/resin-io/etcher
cd etcher
```

Installing npm dependencies
---------------------------

**Make sure you have all the pre-requisites listed above installed in your
system before running the `install` script.**

Please make use of the following scripts to install npm dependencies rather
than simply running `npm install` given that we need to do extra configuration
to make sure native dependencies are correctly compiled for Electron, otherwise
the application might not run successfully.

### OS X

```sh
make electron-develop
```

### GNU/Linux

```sh
make electron-develop
```

### Windows

**Run the following command from the _Developer Command Prompt for VS2015_**,
to ensure all Visual Studio command utilities are available in the `%PATH%`:

```sh
.\scripts\build\windows.bat install <x64|x86>
```

Running the application
-----------------------

### GUI

```sh
npm start
```

### CLI

```sh
node bin/etcher
```
