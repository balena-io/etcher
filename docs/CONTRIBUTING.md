Contributing Guide
==================

Thanks for your interest in contributing to this project! This document aims to
serve as a friendly guide for making your first contribution.

High-level Etcher overview
--------------------------

Make sure you checkout our [ARCHITECTURE.md][ARCHITECTURE] guide, which aims to
explain how all the pieces fit together.

Running locally
---------------

See the [RUNNING-LOCALLY.md][RUNNING-LOCALLY] guide.

Developing
----------

We rely on various `npm` scripts to perform some common tasks:

- `npm run lint`: Run the linter.
- `npm run sass`: Compile SCSS files.

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

- Run `npm run clean-shrinkwrap`. This is a small script that ensures that
  operating system specific dependencies that could get included in the
  previous step are removed from `npm-shrinkwrap.json`.

Some npm versions seem to contain an issue were all development dependencies
will be included in `npm-shrinkwrap.json` when attempting to modify it (e.g: by
`npm install`, `npm uninstall`, etc). A bulletproof way to ensure only the
necessary dependencies get added is to run the following commands:

```sh
make electron-develop
npm prune --production
npm shrinkwrap --dev
```

- Commit *both* `package.json` and `npm-shrinkwrap.json`.

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

- All the tests passes.

- The coding style aligns with the project's convention.

- Your changes are confirmed to be working in recent versions of the operating
systems we support.

Don't hesitate to get in touch if you have any questions or need any help!

[ARCHITECTURE]: https://github.com/resin-io/etcher/blob/master/docs/ARCHITECTURE.md
[RUNNING-LOCALLY]: https://github.com/resin-io/etcher/blob/master/docs/RUNNING-LOCALLY.md
[EditorConfig]: http://editorconfig.org
[shrinkwrap]: https://docs.npmjs.com/cli/shrinkwrap
