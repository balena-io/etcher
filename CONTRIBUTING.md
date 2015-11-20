# Contributing guide

Thanks for your interest in contributing to this project! This document aims to serve as a friendly guide for making your first contribution.

## Prerequisites

- [NodeJS](https://nodejs.org).
- [Bower](http://bower.io).
- [Gulp](http://gulpjs.com).

## Cloning

First, clone the repository:

``` shell
$ git clone https://github/resin-io/herostratus
```

Make sure you install all the dependencies before attempting to run the application:

``` shell
$ npm install && bower install
```

## Developing

We rely on [gulp](http://gulpjs.com) to provide an automated developing workflow in which your changes will automatically be detected and the necessary resources will be rebuilt for you.

First make sure you have [gulp](http://gulpjs.com) installed as a global dependency:

``` shell
$ npm install -g gulp
```

Run the `watch` task to initialise the build system. We encourage to have this command running in the background all the time as you develop, and check the output from time to time, since it'll let you know of any issues and/or warnings in your changes:

``` javascript
$ gulp watch
```

We make use of [EditorConfig](http://editorconfig.org) to communicate indentation, line endings and other text editing default. We encourage you to install the relevant plugin in your text editor of choice to avoid having to fix any issues during the review process.

## Running

You can run the application with the following command in the root of the project:

``` shell
$ npm start
```

## Testing

We include a test suite that covers both the code running in the main process and in the rendered process.

In order to avoid inaccurate results, the test suites run in a real Electron instance each in the respective process. This means that running the test suite is not a cheap operation and therefore we decided to not run it by default in the `watch` gulp task to not disrupt the user development workflow.

To run the test suite, run the following command:

``` shell
npm test
```

Given the nature of this application, not everything can be unit tested. For example:

- The writing operating on real raw devices.
- Platform inconsistencies.
- Style changes.
- Artwork.

We encourage our contributors to test the application on as many operating systems as they can before sending a pull request.

*The test suite is run automatically by CI servers when you send a pull request.*

## Sending a pull request

When sending a pull request, consider the following guidelines:

- Write a concise commit message explaining your changes.
- If applies, write more descriptive information in the commit body.
- Mention the operating systems with the corresponding versions in which you tested your changes.
- If your change affects the visuals of the application, consider attaching a screenshot.
- Refer to the issue/s your pull request fixes, so they're closed automatically when your pull request is merged.

Before your pull request can be merged, the following conditions must hold:

- The linter doesn't throw any warning.
- All the tests passes.
- The coding style aligns with the project's convention.
- Your changes are confirmed to be working in recent versions of the operating systems we support.

Don't hesitate to get in touch if you have any questions or need any help!