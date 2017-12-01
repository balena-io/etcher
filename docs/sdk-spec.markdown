Etcher SDK
==========

This document describes the design and interface of the Etcher SDK.

Preface
-------

Etcher does a traditional type of image flashing, which is to simply copy the
image byte-by-byte (with some exceptions, like omitting certain blocks when
using block maps) to a destination device (like an SD Card).

We discovered deviations of this flashing "mode," like to flash to a board's
internal memory, and noticed a pattern: they all need two "actions":

- Scanning for a set of destinations that are meaningful to the flashing mode
- Flashing an image to one or more destinations found in the scanning phase

In the future, there may be extra actions such as "configure" and "manage",
which modes may decide to give or not.

This specification describes a design for an Etcher SDK that supports different
types of flashing modes.

API
---

The Etcher SDK will expose this API:

### `String[] etcher.SUPPORTED_MODES`

An array of the modes this particular version of the Etcher SDK supports. For
example:

- The "normal" flashing mode we have now
- dfu
- CHIP
- FEL/fastboot

### `EventEmitter etcher.image.fromURL(String url)`

This function creates an *image* object out of an image URL. The implementation
will at least support HTTP, HTTPS, and `file://`.

- `String url`: The url to the image file

The returned `EventEmitter` emits these events:

- `done`: The operation was successful, and the handler argument is the image
  object
- `progress` (optional): The progress details, useful when constructing an
  image object for a certain image will take more time
- `error`: An error occurred

### `EventEmitter etcher.image.fromFile(String path)`

This function is like calling `etcher.image.fromURL()` with a `file://`
protocol.

### `String[] etcher.getSupportedModesForImage(Image image)`

This function returns a list of supported modes for a particular image object.

### `Promise<Destination[]> etcher.scan(Mode mode, Object options)`

This function scans for destinations, passing the `options` object to the
scanner's `.getAll()` function as-is.

If the scanner singleton is not running, this function will yield back an empty
set of destinations.

### `EventEmitter etcher.flash(Mode mode, Image image, Destination[] destinations, Object options)`

This function flashes an image to a set of destinations using a certain mode.

The options object may contain these properties, although there is no guarantee
that every mode will support them all.

- `Boolean check`: Check the result of a flashing process, in whatever way
  makes sense on that mode
- `Object extra`: Extra options specific to the chosen mode

The returned `EventEmitter` emits these events:

- `done`: The operation was successful, and the handler argument is a mode
  specific results object
- `progress`: Flashing progress details
- `error`: An error occurred

The flash implementation may emit custom events, as long as they include an
'extra:' prefix.

Interfaces
----------

The SDK deals with various "entities." This is a formal definition of what
these entities look like:

### Progress

An in-progress action. A progress object may include these properties:

- `String id`: A unique identifier for what the progress is about
- `Number percentage`: The progress percentage
- `Number transferred`: The number of transferred parts (whatever that means in
  the progress context)
- `Number length`: The total number of transferred parts
- `Number remaining`: The number of parts that are pending
- `Number eta`: The number of estimated remaining seconds
- `Number runtime`: The number of seconds the progress was active
- `Number speed`: The average number of parts processed in each tick

### Image

An operating system image file, like `2016-11-25-raspbian-jessie.img`, or
`flintos_rpi_v0.3.img.xz`. An image object should contain these properties:

#### `ReadStream stream`

A readable stream that consumes the image in its original form. For a
compressed image, this stream emits the compressed data.

#### `String type.original`

THe MIME type of the original image size. For a compressed image, this value
should be the compression/archive MIME type.

#### `String type.final`

The MIME type of the final uncompressed image file. For example,
`application/octet-stream`, or `application/x-apple-diskimage`.

#### `String filename`

The name of the original filename of the image. Like `foo.img`, or `bar.zip`.
For a compressed image, the value should be the file name of the compressed
image.

#### `TransformStream stream`

The `stream` uses this transform stream to get the final image data. For a
compressed image, this transform stream should decompress the image. If the
image doesn't need any transformation, then the transform stream should be a
`PassThrough` stream.

#### `Number size.final.value`

The final size of the image. For a compressed image, this is the size of the
uncompressed data. If the image is already uncompressed, then this property
should equal `size.original`.

#### `Boolean size.final.estimation`

This value conveys whether `size.final.value` is an estimated value. There are
some compression formats, like Bzip2, for which its hard to find the final
uncompressed size without uncompressing the image. If this property is `true`,
then `size.final.value` can be a rough estimation.

#### `Number size.original.value`

The original size of the image. For a compressed image, this is the size of the
compressed data.

#### `Boolean size.original.estimation`

This value conveys whether `size.final.value` is an estimated value.

### Destination

The destination object is a target to flash an *image*, like a removable drive.
A destination object can contain any properties (up to the scanner), but it
should include these ones:

#### `String id`

A unique identifier of the destination. In the context of removable drives,
this can be the device path, like `/dev/disk2`, or `\\\\.\\PHYSICALDRIVE3`.

### Scanner

A scanner is an entity that inspects the real world hoping to find a set of
*destinations*. Scanners are singleton objects that look like this:

#### `EventEmitter .start(Object options)`

This function starts the scanner.

- `Number options.times` (defaults to `Infinity`): The number of scans to run.
  When the scanner reaches this number, the scanner stops
- `Number options.delay (defaults to `0`)`: The amount of milliseconds to wait
  between scans
- `Object options.extra`: Scanner-specific extra options

The returned `EventEmitter` should emit these events:

- `start`: A scan phase has just started. The handler argument is the number of
  times the scanner will start
- `stop`: The scanner will stop scanning
- `done`: The scan phase ended. The handler argument is an array of
  *destinations*
- `found`: Emitted potentially various times during a single scan phase,
  passing a single *destination* at a time. This event is useful for scanners
  that can go incrementally
- `wait`: Emitted when the scanner enters a waiting phase. The handler argument
  is the number of milliseconds the waiting will last
- `error`: An error occurred. In such case, the scanner should continue with
  the next scan loop, unless the user explicitly stops it on the `error`
  handler

The scanner implementation may emit custom events, as long as they include an
'extra:' prefix.

#### `EventEmitter .stop()`

This function stops a scanner.

The returned `EventEmitter` should emit these events:

- `done`: The stop action finished successfully
- `error`: An error occurred, and the scanner might be still running

The scanner implementation may emit custom events, as long as they include an
`extra:` prefix.

#### `Boolean .isScanning()`

This function checks if a scanner is active. This function should return `true`
even if the scanner is in a waiting phase.

#### `EventEmitter .getAll(Object options)`

This function retrieves the list of destinations found by the scanner.

- If the scanner is active, then it will return the last found list of
  destinations
- If the scanner is inactive, then it will return an empty array

The returned `EventEmitter` should emit these events:

- `done`: The retrieval was successful, and the handler argument is an array of
  destinations
- `error`: An error occurred

The supported options are scanner specific. In the context of local drives, one
option could be a `safe` boolean that would cause `.getAll()` to filter out
fixed and system drives.

#### `EventEmitter .get(String id)`

This function retrieves a single destination by its id.

- If the scanner is active, and the id exists, then it will return the
  destination
- If the scanner is active, and the id doesn't exist, then it will return
  `null`
- If the scanner is not running, then it will return `null`

The returned `EventEmitter` should emit these events:

- `done`: The retrieval was successful (even if the destination was not found),
  and the handler argument is either the destination, or `null`
- `error`: An error occurred

