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

### Windows

- [Rimraf](https://github.com/isaacs/rimraf)
- [Asar](https://github.com/electron/asar)
- [NSIS v2.51](http://nsis.sourceforge.net/Main_Page) (v3.x won't work)
- [Visual Studio Community 2013](https://www.visualstudio.com/en-us/news/vs2013-community-vs.aspx)
- [7z](http://www.7-zip.org) (command line version)

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
./scripts/build/darwin.sh install
```

### GNU/Linux

```sh
./scripts/build/linux.sh install <x64|x86>
```

### Windows

**Run the following command from the _Developer Command Prompt for VS2013_**,
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
