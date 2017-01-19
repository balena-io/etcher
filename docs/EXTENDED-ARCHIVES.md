Etcher Extended Archives
========================

Etcher extended archives are archive files including an image and a special
metadata directory including information that describes the image, device type,
and publisher in detail, enabling Etcher to make use of such information to
deliver advanced features and a more pleasant experience to the user.

Entities
--------

### Publisher

A publisher represents an entity that maintains and publishes operating system
images.

*Some examples of image publishers are: Tizen, RetroPie, Resin.io, and CoreOS.*

### Device

A device represents a specific device type manufactured by a vendor.

*Some examples of devices are: Beaglebone Black, Beaglebone Green, Intel
Edison, and Raspberry Pi 3.*

### Client

A client represents the program making use of the information about the other
entities.

*At the moment of this writing, the only existent client is the Etcher application.*

File format
-----------

The file format should have the following characteristics:

- Streamability: The extended archive allows the client to consume all its
  information in a streaming fashion

- Compression: The extended archive should be compressed in order to save
  network resources

We base this format on the [`tar`][tar] archive format, which has the following
benefits:

- It's a common archive format, so it'd be easy to find robust modules to work
  with in any platform ecosystem

- It allows us to easily impose a file order, which greatly helps with
  streamability. This is not trivial with `zip`, for instance

- It precedes each file with a header construct, making it streaming friendly

The [`tar`][tar] archive is then compressed with the [`xz`][xz] data
compression format, which has the following benefits:

- A native, robust, performant, cross-platform and streaming-based
  decompression library for [node.js][nodejs], called
  [`lzma-native`][lzma-native], which we battle tested at Etcher

- A way to calculate the precise uncompressed size of the file no matter the
  size (which is a [known limitation of `gzip` after 4
  GB](https://github.com/resin-io/etcher/issues/638)), and an operation
  [`lzma-native`][lzma-native] supports out of the box. This is not possible
  with `bzip2`

- Decent compression ratio, and compression/decompression time

The resulting file should contain the `.etch` extension.

Archive layout
--------------

The contents of an extended archive are the followings:

- **REQUIRED** `.meta/manifest.json`
- **REQUIRED** `<image name>.<extension>`
- `.meta/checksum`

### Order

Notice that the order is important. The `.meta/` directory must come before the
image data, and `.meta/manifest.json` should be the first entry, since we need
that information before being able to make use of the image.

### Graphics

Any graphic included in the archive can be either an [`svg`][svg] file, or a
[`png`][png] file.

If both are present, [`svg`][svg] should be favoured by the client.

Ifa [`png`][png] file path is declared and the client detects that the host is
running a high definition screen, it may search for a `<filename>@2x.png` file
in the archive.

### Paths

The `.meta/manifest.json` file may refer to other files in the package. If the
property searches for the file relative to `.meta`, then it should not allow
accessing the parent directory with `..`.

Archive files
-------------

### `.meta/manifest.json`

This is the only required file inside `.meta`, which declares information about
the image.

Here's an example of a real-world manifest for Raspbian Jessie

```json
[
  {
    "publisher": {
      "name": "Raspberry Pi",
      "url": "https://www.raspberrypi.org",
      "logo": "raspberrypi.svg",
      "colorScheme": {
        "background": "#535760",
        "text": "#FFFFFF",
        "primary": "#5793db"
      }
    },
    "images": [
      {
        "name": "Raspbian Jessie",
        "version": "May 2016",
        "url": "https://www.raspberrypi.org/downloads/raspbian/",
        "supportUrl": "https://retropie.org.uk/forum/",
        "logo": "raspbian.svg",
        "checksum": {
          "type": "sha1",
          "path": "raspbian-jessie-checksum.txt"
        },
        "path": "raspbian-jessie.img",
        "bmap": "raspbian-jessie.img.bmap",
        "instructions": "raspbian-jessie.markdown",
        "releaseNotes": "raspbian-jessie-changelog.txt",
        "configurationSchema": "raspbian-jessie-schema.json",
        "recommendedDriveSize": 4294967296,
        "updateUrl": "https://downloads.raspberrypi.org/raspbian_latest",
        "etag": "c0170-53152af2-533d18ef29fc0"
      }
    ]
  }
]
```

Each entry of this file may contain the following properties:

#### `publisher.name (String)`

The display human-friendly name of the publisher.

#### `publisher.url (String)`

The main url of the publisher, usually the landing page.

#### `publisher.logo (String)`

The path to a logo that represents the publisher, relative to the `.meta`
directory.

#### `publisher.colorScheme (Object)`

The publisher specific color scheme, if any.

The client may allow a certain degree of branding based on this color scheme.

You may declare the following colors, in hexadecimal format:

- `background`: The background color
- `text`: The text color
- `primary`: The primary color

The client decides how to use them and where, if at all.

#### `images[].name (String)`

The human-friendly name of the image.

#### `images[].version (String)`

The version of the image.

#### `images[].url (String)`

The main url of the image.

#### `images[].supportUrl (String)`

The url where users can get general support for this image.

This could be a link to a forum, IRC room, troubleshooting page, support form,
etc.

#### `images[].logo (String)`

The path to a logo that represents the image, relative to the `.meta`
directory.

#### `images[].releaseDate (String)`

The release date timestamp. The date should conform to [ISO 8601][iso8601]
standard.

#### `images[].checksum.type (String)`

The checksum type. The current possible values are: `sha1`, `sha256`, `crc32`,
and `md5`.

#### `images[].checksum.path (String)`

The path to a file containing the checksum, relative to the root of the
archive. This file **can't be inside `.meta/`** and should be included **at the
tail of the archive**.

#### `images[].path (String)`

The path to the image, relative to the root of the archive.

#### `images[].bmap (String)`

The path a [`bmap`][bmap] file for the image, relative to the `.meta`
directory.

#### `images[].instructions (String)`

The path a markdown post-flash instructions file for the image, relative to the
`.meta` directory.

#### `images[].releaseNotes (String)`

The path to a plain text file describing the image version's release notes,
relative to the `.meta` directory.

#### `images[].configurationSchema (String)`

The path to a [Reconfix][reconfix] image configuration schema, relative to the
`.meta` directory.

#### `images[].recommendedDriveSize (Number)`

The minimum recommended drive size to flash this image, in bytes.

The use case for this option is that while a drive might be large enough to
contain the image, it might not be large enough to deliver a good experience
when actually using the application or operating system contained in the image.

#### `images[].updateUrl (String)`

The url where the client can request the latest version of the image.

The way this works is that you provide a generic url that redirects to the
latest image resource. The client will follow all redirects until it finds the
final image, and will check (using the `etag` property) if the resource matches
the currently selected image.

If the ETags don't match, the client may point the user to download the new one
image.

If the HTTP response from `updateUrl` doesn't contain an ETag this mechanism is
ignored.

#### `images[].etag (String)`

The [HTTP Etag][etag] of the current image.

Clients may use this to check if the image resolved by `updateUrl` is different
to the one we have locally.

#### `images[].expiryDate (String)`

The timestamp to determine the expiration date of the image. The date should
conform to [ISO 8601][iso8601] standard.

Clients may use this information to warn against flashing the image.

#### Extensions

Each of the entities described above accept an object property called
`extensions`, which you can use to provide custom properties to the manifests,
in a way that are specific to your application. It is encouraged that you put
those custom properties inside the `extensions` namespace to avoid potential
clashes with other properties that may be introduced in the future.

For example:

```json
{
  "publisher": {
    ..
    "extensions": {
      ..
    },
    ..
    "images": [
      {
        ..
        "extensions": {
          ..
        }
        ..
      }
    ]
  }
}
```

### `<image name>.<extension>`

An image file **in uncompressed form**. Clients should not attempt to
decompress the image file since the extended archive already includes
compression. If the image is compressed, then the client should write
compressed bytes to the drive.

This file should be references by `.meta/manifest.json`'s `path` property.

### `.meta/<checksum file name>`

For example: `64c7ed611929ea5178fbb69b5a5f29cc9cc7c157`

This file contains the checksum matching the type specified in the
`images[].checksum.type` field of an image section of `.meta/manifest.json`,
and it should be referenced by the `images[].checksum.path` property.

The reason the actual checksum is at the end of the archive is that if any tool
modifies the image inside the extended archive, it will need to update the
checksum.

Having it at the end means that the client can do any necessary transformations
in a streaming way, while calculating the new checksum, and write it once the
image has been processed.

[tar]: https://www.gnu.org/software/tar/
[xz]: http://tukaani.org/xz/
[nodejs]: https://nodejs.org
[lzma-native]: https://github.com/addaleax/lzma-native
[svg]: https://developer.mozilla.org/en-US/docs/Web/SVG
[png]: http://www.libpng.org/pub/png/
[reconfix]: https://github.com/resin-io/reconfix
[bmap]: https://source.tizen.org/documentation/reference/bmaptool/introduction
[iso8601]: https://en.wikipedia.org/wiki/ISO_8601
[etag]: https://en.wikipedia.org/wiki/HTTP_ETag
