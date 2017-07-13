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

'use strict';

const m = require('mochainon');
const StreamReadable = require('stream').Readable;
const utils = require('../../lib/image-stream/utils');

describe('ImageStream: Utils', function() {

  describe('.extractStream()', function() {

    describe('given a stream that emits data', function() {

      beforeEach(function() {
        this.stream = new StreamReadable();

        /* eslint-disable no-underscore-dangle */

        this.stream._read = function() {

        /* eslint-enable no-underscore-dangle */

          this.push(Buffer.from('Hello', 'utf8'));
          this.push(Buffer.from(' ', 'utf8'));
          this.push(Buffer.from('World', 'utf8'));
          this.push(null);
        };
      });

      it('should yield the stream data', function() {
        return utils.extractStream(this.stream).then((data) => {
          m.chai.expect(data.toString()).to.equal('Hello World');
        });
      });

    });

    describe('given a stream that throws an error', function() {

      beforeEach(function() {
        this.stream = new StreamReadable();

        /* eslint-disable no-underscore-dangle */

        this.stream._read = function() {

        /* eslint-enable no-underscore-dangle */

          this.emit('error', new Error('stream error'));
        };
      });

      it('should be rejected with the error', function() {
        return utils.extractStream(this.stream).catch((error) => {
          m.chai.expect(error).to.be.an.instanceof(Error);
          m.chai.expect(error.message).to.equal('stream error');
        });
      });

    });

  });

});
