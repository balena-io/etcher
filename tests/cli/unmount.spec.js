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
const unmount = require('../../lib/cli/unmount');

describe('CLI: Unmount', function() {

  describe('.getUNIXUnmountCommand()', function() {

    it('should return the correct command for OS X', function() {
      const command = unmount.getUNIXUnmountCommand('darwin', {
        device: '/dev/disk2',
        description: 'DataTraveler 2.0',
        size: 7823458304,
        mountpoints: [
          {
            path: '/Volumes/UNTITLED'
          }
        ],
        raw: '/dev/rdisk2',
        protected: false,
        system: false
      });

      m.chai.expect(command).to.equal('/usr/sbin/diskutil unmountDisk force /dev/disk2');
    });

    it('should return the correct command for GNU/Linux', function() {
      const command = unmount.getUNIXUnmountCommand('linux', {
        device: '/dev/sda',
        description: 'DataTraveler 2.0',
        size: 7823458304,
        mountpoints: [
          {
            path: '/media/UNTITLED'
          }
        ],
        raw: '/dev/sda',
        protected: false,
        system: false
      });

      m.chai.expect(command).to.equal('umount /dev/sda?* 2>/dev/null || /bin/true');
    });

  });

});
