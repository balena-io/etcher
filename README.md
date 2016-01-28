Etcher
======

> The easy way to burn images in all operating systems

[![dependencies](https://david-dm.org/resin-io/etcher.svg)](https://david-dm.org/resin-io/etcher.svg)
[![Build Status](https://travis-ci.org/resin-io/etcher.svg?branch=master)](https://travis-ci.org/resin-io/etcher)
[![Build status](https://ci.appveyor.com/api/projects/status/xggqv231byfhync1/branch/master?svg=true)](https://ci.appveyor.com/project/resin-io/etcher/branch/master)
[![Gitter](https://badges.gitter.im/Join Chat.svg)](https://gitter.im/resin-io/chat)
[![Stories in Ready](https://badge.waffle.io/resin-io/etcher.svg?label=in progress&title=In Progress)](https://waffle.io/resin-io/etcher)

***

[**Installing**](https://github.com/resin-io/etcher#installation) | [**Support**](https://github.com/resin-io/etcher/issues/new) | [**Contributing**](https://github.com/resin-io/etcher/blob/master/CONTRIBUTING.md) | [**CLI**](https://github.com/resin-io/etcher-cli)

![Etcher](https://raw.githubusercontent.com/resin-io/etcher/master/screenshot.png)

**Notice:** Etcher is in a very early state and things might break or not work at all in certain setups.

Installation
------------

We're working on providing installers for all major operating systems.

For now you can manually run the application with the following commands:

```sh
git clone https://github.com/resin-io/etcher
cd etcher
npm install && bower install

# In GNU/Linux, your home directory needs execution permissions
# in order to run Etcher as expected due to a bug in Electron.
# See https://github.com/atom/electron/issues/3666
sudo chmod a+x /home/<user>

npm start
```

Support
-------

If you're having any problem, please [raise an issue](https://github.com/resin-io/etcher/issues/new) on GitHub and the Resin.io team will be happy to help.

License
-------

Etcher is free software, and may be redistributed under the terms specified in the [license](https://github.com/resin-io/etcher/blob/master/LICENSE).
