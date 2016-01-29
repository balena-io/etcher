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
npm start
```

GNU/Linux
---------

There is a [known electron issue](https://github.com/atom/electron/issues/3666) that prevents Etcher from running correctly when cloned in directories that don't have global execution permissions at any point of the path.

Until this issue is fixed, we recommend cloning Etcher in directories like `/opt`, and making sure they have execution permissions with:

```sh
chmod a+x /opt
```

You can still run Etcher from inside your home directory by giving your home directory global execution permissions, but notice this might bring security concerns. Do it at your own risk.

Support
-------

If you're having any problem, please [raise an issue](https://github.com/resin-io/etcher/issues/new) on GitHub and the Resin.io team will be happy to help.

License
-------

Etcher is free software, and may be redistributed under the terms specified in the [license](https://github.com/resin-io/etcher/blob/master/LICENSE).
