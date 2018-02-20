# Etcher SDK

## Modules

This section shall give a broad overview of the modules used by the Etcher SDK, and what they're used for.

### Writer / Image Stream

#### [resin-io-modules] / [pipage](https://github.com/resin-io-modules/pipage)

#### [resin-io-modules] / [blockmap](https://github.com/resin-io-modules/blockmap)

The `blockmap` module implements parsing of Tizen's bmap format to facilitate only reading & writing relevant blocks of an image. Its Blockmap can be used to dynamically add/remove ranges at runtime in conjunction with its ReadStreams and FilterStreams.

#### [resin-io-modules] / [win-drive-clean](https://github.com/resin-io-modules/win-drive-clean)

This module's sole purpose is to avoid shelling out to `diskpart` on Windows, due to how frequently it doesn't succeed in removing the partition table of a given device - `win-drive-clean` will use `DeviceIoControl()` to remove the partition table's signature of a storage device, in order to be able to write to it. This is necessary because Windows protects writes to the partition table areas of any storage device containing a recognized MBR or GPT.

### Image Formats

#### [addaleax] / [lzma-native](https://github.com/addaleax/lzma-native)

#### [regular] / [unbzip2-stream](https://github.com/regular/unbzip2-stream)

#### [antelle] / [node-stream-zip](https://github.com/antelle/node-stream-zip)

#### [thejoshwolfe] / [yauzl](https://github.com/thejoshwolfe/yauzl)

#### [jhermsmeier] / [node-udif](https://github.com/jhermsmeier/node-udif)

#### [jhermsmeier] / [node-mbr](https://github.com/jhermsmeier/node-mbr)

#### [jhermsmeier] / [node-gpt](https://github.com/jhermsmeier/node-gpt)

### Adapters

#### [resin-io-modules] / [drivelist](https://github.com/resin-io-modules/drivelist)

#### [tessel] / [node-usb](https://github.com/tessel/node-usb)

#### [resin-io-modules] / [winusb-driver-generator](https://github.com/resin-io-modules/winusb-driver-generator)



[resin-io-modules]: https://github.com/resin-io-modules
[jviotti]: https://github.com/jviotti
[antelle]: https://github.com/antelle
[regular]: https://github.com/regular
[addaleax]: https://github.com/addaleax
[thejoshwolfe]: https://github.com/thejoshwolfe
[tessel]: https://github.com/tessel
[jhermsmeier]: https://github.com/jhermsmeier
