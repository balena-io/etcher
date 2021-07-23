# Building etcher on Windows, Linux, and Mac

> How do you build etcher? On Windows, Linux, Mac

It’s the same on all systems:

First clone the repository recursively:

`git clone --recursive https://github.com:balena-io/etcher`

```
rm -rf node_modules
make electron-develop
npm start
```

To build packages for distribution, run `make electron-build` after the steps above.

### Windows

> What version of mingw and visual studio  are needed to build? Any other dependencies for windows? Instructions for how to install?

Visual studio 2019 with:
  * MSVC v142 x86-64 build tools
  * Windows 10 SDK

Also install Windows Driver Kit from https://docs.microsoft.com/en-us/windows-hardware/drivers/download-the-wdk
 - you might have to look under "previous versions" for the windows wdk to match your windows sdk
 - all you need from this page is the WDK, you can ignore everything else, just download it

pip install -r requirements.txt

Mingw64, install it from https://www.msys2.org/

install choco: https://chocolatey.org/install
install jq: choco install jq -y

Add /c/msys64/usr/bin/ to path


> It appears you’re supposed to use `npm i` and then `npm watch` and then `npm start` in order to build/run the electron app, but I’m getting the error:

NODE_MODULE_VERSION 88. This version of Node.js requires
NODE_MODULE_VERSION 80. Please try re-compiling or re-installing

From the module `xxhash`

This error means that a module wasn’t built for the correct runtime (node or electron) and version. In general it means that either you ran `npm i` instead of `make electron-develop` or you just updated the electron version.
Remove the node_modules folder and run `make electron-develop`, that should fix it.

If you want to use only npm, set up some env vars to target the correct runtime as in https://github.com/balena-io/EtcherProApplication/blob/v1.0.0/Dockerfile#L11-L13


Each time you change a js file, you need to run `npm webpack` again. This is quite slow. To make it faster leave `npm run watch` running. It actually just runs `webpack --watch`

https://github.com/electron/electron/blob/master/docs/tutorial/using-native-node-modules.md

### Mac OS X

Install XCode via the App Store

> I get the error: `gyp: No Xcode or CLT version detected!`

Fix with:

```
sudo xcodebuild -license accept
```

> I get the error: `xcode-select: error: tool 'xcodebuild' requires Xcode, but active developer directory '/Library/Developer/CommandLineTools' is a command line tools instance`

Fix with:

```
sudo xcode-select -s /Applications/Xcode.app/Contents/Developer
```

> I get the error: `[webpack-cli] Error: Could not find lzma_native binding`

Try removing node_modules and running `make electron-develop` again.

### Linux

Should work OOTB, please create issue if not.

* Note: Might have to downgrade to Node 14


### FreeBSD

Should work OOTB, please create issue if not.

* Note: Might have to downgrade to Node 14
