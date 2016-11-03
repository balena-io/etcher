Etcher Architecture
===================

This document aims to serve as a high-level overview of how Etcher works,
specially oriented for contributors who want to understand the big picture.

Technologies
------------

This is a non exhaustive list of the major frameworks, libraries, and other
technologies used in Etcher that you should become familiar with:

- [Electron][electron]
- [NodeJS][nodejs]
- [AngularJS][angularjs]
- [Redux][redux]
- [ImmutableJS][immutablejs]
- [Bootstrap][bootstrap]
- [Sass][sass]
- [Flexbox Grid][flexbox-grid]
- [Mocha][mocha]
- [JSDoc][jsdoc]

Module architecture
-------------------

Instead of embedding all the functionality required to create a full-featured
image writer as a monolithic project, we try to hard to follow the ["lego block
approach"][lego-blocks].

This has the advantage of allowing other applications to re-use logic we
implemented for Etcher in their own project, even for things we didn't expect,
which leads to users benefitting from what we've built, and we benefitting from
user's bug reports, suggestions, etc, as an indirect way to make Etcher better.

The fact that low-level details are scattered around many different modules can
make it challenging for a new contributor to wrap their heads around the
project as a whole, and get a clear high level view of how things work or where
to submit their work or bug reports.

These are the main Etcher components, in a nutshell:

- [Etcher Image Write][etcher-image-write]

This is the repository that implements the actual procedures to write an image
to a raw device and the place where image validation resides. Its main purpose
is to abstract the messy details of interacting with raw devices in all major
operating systems.

- [Etcher Image Stream](https://github.com/resin-io-modules/etcher-image-stream)

The goal of this project is to convert any kind of input into a readable stream
representing the image so it can be plugged to [etcher-image-write]. Inputs
that this module might handle could be, for example: a simple image file, a URL
to an image, a compressed image, an image inside a ZIP archive, etc. Together
with [etcher-image-write], these modules are the building blocks needed to take
an image representation to the user's device, the "Etcher's backend".

- [Drivelist](https://github.com/resin-io-modules/drivelist)

As the name implies, this module's duty is to detect the connected drives
uniformly in all major operating systems, along with valuable metadata, like if
a drive is removable or not, to prevent users from trying to write an image to
a system drive.

- [Etcher](https://github.com/resin-io/etcher)

This is the *"main repository"*, from which you're reading this from, which is
basically the front-end and glue for all previously listed projects.

Front-ends
----------

The main repository consists of the implementation of the Etcher CLI and the
Etcher GUI (the desktop application), located at [`lib/cli/`][cli-dir] and
[`lib/gui/`][gui-dir], respectively.

In fact, the only front-end that interacts directly with Etcher's backend is
the CLI. The GUI merely forks the CLI and communicates with its child process
to get state information.

In this sense, you can consider the GUI as being the front-end to the CLI,
which is in turn the front-end to the actual image writing functionality.

As a way to simplify how the GUI forks the CLI in a packaged and distributed
context, both the CLI and GUI share the same application entry point. This
means that the same Etcher binary can behave as CLI or GUI as needed.

## Process communication

As mentioned before, the Etcher GUI forks the CLI and retrieves information
from it to update its state. In order to accomplish this, the Etcher CLI
contains certain features to ease communication:

- [Well-documented exit codes.][exit-codes]

- A `--robot` option, which causes the Etcher CLI to output state in a way that
can be easily machine-parsed.

Summary
-------

We always welcome contributions to Etcher as well as our documentation. If you
want to give back, but feel that your knowledge on how Etcher works is not
enough to tackle a bug report or feature request, use that as your advantage,
since fresh eyes could help unveil things that we take for granted, but should
be documented instead!

[lego-blocks]: https://github.com/sindresorhus/ama/issues/10#issuecomment-117766328
[etcher-image-write]: https://github.com/resin-io-modules/etcher-image-write
[exit-codes]: https://github.com/resin-io/etcher/blob/master/lib/src/exit-codes.js
[cli-dir]: https://github.com/resin-io/etcher/tree/master/lib/cli
[gui-dir]: https://github.com/resin-io/etcher/tree/master/lib/gui
[electron]: http://electron.atom.io
[nodejs]: https://nodejs.org
[angularjs]: https://angularjs.org
[redux]: http://redux.js.org
[immutablejs]: http://facebook.github.io/immutable-js/
[bootstrap]: http://getbootstrap.com
[sass]: http://sass-lang.com
[flexbox-grid]: http://flexboxgrid.com
[mocha]: http://mochajs.org
[jsdoc]: http://usejsdoc.org
