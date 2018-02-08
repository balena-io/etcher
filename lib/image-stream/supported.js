/*
 * Copyright 2016 resin.io
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *    http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

'use strict'

/**
 * @summary Supported filename extensions
 * @description
 * NOTE: Extensions with type: 'compressed' will be stripped
 * from filenames to determine the format of the uncompressed image.
 * For details, see lib/image-stream/README.md
 * @const {Array}
 */
module.exports = [
  {
    extension: 'zip',
    type: 'archive'
  },
  {
    extension: 'etch',
    type: 'archive'
  },
  {
    extension: 'gz',
    type: 'compressed'
  },
  {
    extension: 'bz2',
    type: 'compressed'
  },
  {
    extension: 'xz',
    type: 'compressed'
  },
  {
    extension: 'img',
    type: 'image'
  },
  {
    extension: 'iso',
    type: 'image'
  },
  {
    extension: 'bin',
    type: 'image'
  },
  {
    extension: 'dsk',
    type: 'image'
  },
  {
    extension: 'hddimg',
    type: 'image'
  },
  {
    extension: 'raw',
    type: 'image'
  },
  {
    extension: 'dmg',
    type: 'image'
  },
  {
    extension: 'sdcard',
    type: 'image'
  },
  {
    extension: 'rpi-sdimg',
    type: 'image'
  }
]
