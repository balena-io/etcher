Etcher Image Stream
===================

This module is in charge of creating a readable stream from any image source
(e.g: a file, a URL, etc) along with some metadata (like size), and handling
any necessary transformations (like decompression) that must be applied before
plugging the stream to [`etcher-image-write`][etcher-image-write].

Given that this module contains the logic to handle image formats, the module
becomes the most reliable source of truth for the list of supported ones.

There are three classes of images this module supports:

- Uncompressed images (e.g: `.img`, `.iso`)
- Compressed images (e.g: `.img.xz`, `.iso.gz`)
- Archive images (e.g: `.zip`)

The core of this module consists of handlers and archive hooks.

Handlers
--------

The handlers are functions that know how to handle certain MIME types, like
`application/x-bzip2` and `application/octet-stream`, returning a stream for
the image, a transform stream that needs to be applied to get the real image
data, and useful metadata like the final image size.

Each handler is called with a file path (although that will change soon once we
add proper support for URLs) and an options object, containing extra metadata
about the file.

Archive Hooks
-------------

This module supports reading "archive images", which are defined by handlers
(like `application/zip`). In order to avoid duplication on how to handle
archives, archive support is implemented by "archive hooks".

Archive hooks are CommonJS modules that expose two functions:

- `Promise .getEntries(String archivePath)`: list all entries in the archive
- `Stream.Readable .extractFile(String archivePath, String[] entries, String entry)`: get a readable stream for an archive entry

Defining those two functions for any archive format is enough for Etcher to
correctly use its archive handling logic on them.

Archive Images
--------------

As mentioned before, Etcher supports the concept of "archive images". These are
uncompressed image files included *inside* an archive format, like `.zip` or
`.tar`, possibly along other files.

These are the rules for handling archive images:

- Each archive should only contain one valid image
- Images in archives should be in uncompressed form

The module throws an error if the above rules are not met.

Supported Formats
-----------------

There are currently three image types in supported formats: `image`, `compressed` and `archive`.

An extension tagged `image` describes a format which can be directly written to a device by its handler,
and an extension tagged `archive` denotes an archive containing an image, and will cause an archive handler
to open the archive and search for an image file.

Note that when marking an extension as `compressed`, the filename will be stripped of that extension,
and the leftover extension examined to determine the uncompressed image format (i.e. `.img.gz -> .img`).

As an archive (such as `.tar`) might be additionally compressed, this will allow for constructs such as
`.tar.gz` (a compressed archive, containing a file with an extension tagged as `image`) to be handled correctly.

[etcher-image-write]: https://github.com/resin-io-modules/etcher-image-write
