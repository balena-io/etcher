Running locally
===============

This document aims to serve as a guide to get Etcher running locally on your
development machine.

Prerequisites
-------------

### Common

- [NodeJS](https://nodejs.org) (at least v6)
- [Python](https://www.python.org)
- [jq](https://stedolan.github.io/jq/)
- [Asar](https://github.com/electron/asar)
- [Codespell](https://github.com/lucasdemarchi/codespell)
- [curl](https://curl.haxx.se/)

### Windows

- [Rimraf](https://github.com/isaacs/rimraf)
- [NSIS v2.51](http://nsis.sourceforge.net/Main_Page) (v3.x won't work)
- Either one of the following:
  - [Visual C++ 2015 Build Tools](http://landinghub.visualstudio.com/visual-cpp-build-tools) containing standalone compilers, libraries and scripts
  - Install the [windows-build-tools](https://github.com/felixrieseberg/windows-build-tools) via npm with `npm install --global windows-build-tools`
  - [Visual Studio Community 2015](https://www.microsoft.com/en-us/download/details.aspx?id=48146) (free) (other editions, like Professional and Enterprise, should work too)
    **NOTE:** Visual Studio 2015 doesn't install C++ by default. You have to rerun the
    setup, select "Modify" and then check `Visual C++ -> Common Tools for Visual
    C++ 2015` (see http://stackoverflow.com/a/31955339)
- [MinGW](http://www.mingw.org)

The following MinGW packages are required:

- `msys-make`
- `msys-unzip`
- `msys-zip`
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

If you're on Windows, **run the command from the _Developer Command Prompt for
VS2015_**, to ensure all Visual Studio command utilities are available in the
`%PATH%`.

```sh
make electron-develop
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
