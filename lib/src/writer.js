/* The MIT License
 *
 * Copyright (c) 2015 Resin.io. https://resin.io.
 *
 * Permission is hereby granted, free of charge, to any person obtaining a copy
 * of this software and associated documentation files (the "Software"), to deal
 * in the Software without restriction, including without limitation the rights
 * to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 * copies of the Software, and to permit persons to whom the Software is
 * furnished to do so, subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be included in
 * all copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
 * THE SOFTWARE.
 */

var imageWrite = require('resin-image-write');
var Promise = require('bluebird');
var umount = Promise.promisifyAll(require('umount'));
var fs = require('fs');

/**
 * @summary Get image readable stream
 * @function
 * @private
 *
 * @description
 * This function adds a custom `.length` property
 * to the stream which equals the image size in bytes.
 *
 * @param {String} image - path to image
 * @returns {ReadableStream} image stream
 *
 * @example
 * var stream = writer.getImageStream('foo/bar/baz.img');
 */
exports.getImageStream = function(image) {
  'use strict';

  var stream = fs.createReadStream(image);
  stream.length = fs.statSync(image).size;
  return stream;
};

/**
 * @summary Write an image to a disk drive
 * @function
 * @public
 *
 * @description
 * See https://github.com/resin-io/resin-image-write for information
 * about the `state` object passed to `onProgress` callback.
 *
 * @param {String} image - path to image
 * @param {String} drive - drive device
 * @param {Function} onProgress - on progress callback (state)
 *
 * @returns {Promise}
 *
 * @example
 * writer.writeImage('path/to/image.img', '/dev/disk2', function(state) {
 *   console.log(state.percentage);
 * }).then(function() {
 *   console.log('Done!');
 * });
 */
exports.writeImage = function(image, drive, onProgress) {
  'use strict';

  return umount.umountAsync(drive).then(function() {
    var stream = exports.getImageStream(image);
    return imageWrite.write(drive, stream);
  }).then(function(writer) {
    return new Promise(function(resolve, reject) {
      writer.on('progress', onProgress);
      writer.on('error', reject);
      writer.on('done', resolve);
    });
  }).then(function() {
    return umount.umountAsync(drive);
  });
};
