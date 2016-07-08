Contributing Guide
==================

Thanks for your interest in contributing to this project! This document aims to
serve as a friendly guide for making your first contribution.

High-level Etcher overview
--------------------------

Make sure you checkout our [ARCHITECTURE.md][ARCHITECTURE] guide, which aims to
explain how all the pieces fit together.

Prerequisites
-------------

- [NodeJS](https://nodejs.org).
- [Bower](http://bower.io).
- [Gulp](http://gulpjs.com).

Running locally
---------------

- Install [NodeJS](https://nodejs.org/en/).

Sadly we need to enforce the same NodeJS version that the Electron version we
use is running to avoid module version mismatches when building native
dependencies (`electron-rebuild` doesn't seem to be enough).

- Clone the repository.

```sh
git clone https://github.com/resin-io/etcher
cd etcher
```

- Configure NPM.

In UNIX based operating systems:

```sh
export npm_config_disturl=https://atom.io/download/atom-shell
export npm_config_target=<ELECTRON_VERSION>
export npm_config_runtime=electron
```

In Windows:

```sh
set npm_config_disturl=https://atom.io/download/atom-shell
set npm_config_target=<ELECTRON_VERSION>
set npm_config_runtime=electron
```

You can find the appropriate electron version in the
`devDependencies['electron-prebuilt']` field in `package.json`.

- Install dependencies.

```sh
npm install --build-from-source
bower install
```

- Run the GUI application.

```sh
npm start
```

- Run the CLI application.

```sh
node bin/etcher
```

Developing
----------

We rely on [gulp] to provide an automated developing workflow in which your
changes will automatically be detected and the necessary resources will be
rebuilt for you.

First make sure you have [gulp] installed as a global dependency:

```sh
$ npm install -g gulp
```

Run the `watch` task to initialise the build system. We encourage to have this
command running in the background all the time as you develop, and check the
output from time to time, since it'll let you know of any issues and/or
warnings in your changes:

```js
$ gulp watch
```

We make use of [EditorConfig] to communicate indentation, line endings and
other text editing default. We encourage you to install the relevant plugin in
your text editor of choice to avoid having to fix any issues during the review
process.

Testing
-------

In order to avoid inaccurate results, the test suites run in a real Electron
instance each in the respective process. This means that running the test suite
is not a cheap operation and therefore we decided to not run it by default in
the `watch` gulp task to not disrupt the user development workflow.

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

Sending a pull request
----------------------

We make use of [commitizen] to ensure certain commit conventions, since they
will be used to auto-generate the CHANGELOG. The project already includes all
necessary configuration, so you only have to install the commitizen cli tool
(`npm install -g commitizen`) and commit by executing `git cz`, which will
drive you through an interactive wizard to make sure your commit is perfectly
crafted according to our guidelines.

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

- Squash commits when possible, for example, when commiting review changes.

Before your pull request can be merged, the following conditions must hold:

- The linter doesn't throw any warning.

- All the tests passes.

- The coding style aligns with the project's convention.

- Your changes are confirmed to be working in recent versions of the operating
systems we support.

Don't hesitate to get in touch if you have any questions or need any help!

[ARCHITECTURE]: https://github.com/resin-io/etcher/blob/master/docs/ARCHITECTURE.md
[gulp]: http://gulpjs.com
[EditorConfig]: http://editorconfig.org
[commitizen]: https://commitizen.github.io/cz-cli/#making-your-repo-commitizen-friendly
