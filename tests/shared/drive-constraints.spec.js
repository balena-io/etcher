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
const DriveConstraints = require('../../lib/shared/drive-constraints');

describe('(new DriveConstraints(drive))', function() {

  describe('.isSystemDrive()', function() {
    describe('given drive is fixed', function() {
      before(function() {
        const drive = {
          system: true
        };
        this.constraints = new DriveConstraints(drive);
      });

      it('should return true', function() {
        m.chai.expect(this.constraints.isSystemDrive()).to.be.true;
      });
    });

    describe('given drive is removable', function() {
      before(function() {
        const drive = {
          system: false
        };
        this.constraints = new DriveConstraints(drive);
      });

      it('should return false', function() {
        m.chai.expect(this.constraints.isSystemDrive()).to.be.false;
      });
    });
  });

  describe('.isRecommendedSize()', function() {
    describe('given drive.size is 0 and recommended size is not specified', function() {
      before(function() {
        const drive = {
          size: 0
        };
        this.constraints = new DriveConstraints(drive);
        this.image = {};
      });

      it('should return true ', function() {
        m.chai.expect(this.constraints.isRecommendedSize(this.image)).to.be.true;
      });
    });
    describe('given drive.size is 1000 and recommended size is 1000', function() {
      before(function() {
        const drive = {
          size: 1000
        };
        this.constraints = new DriveConstraints(drive);
        this.image = {
          recommendedDriveSize: 1000
        };
      });

      it('should return true ', function() {
        m.chai.expect(this.constraints.isRecommendedSize(this.image)).to.be.true;
      });
    });

    describe('given drive.size is 1000 and recommended size is 1001', function() {
      before(function() {
        const drive = {
          size: 1000
        };
        this.constraints = new DriveConstraints(drive);
        this.image = {
          recommendedDriveSize: 1001
        };
      });

      it('should return false ', function() {
        m.chai.expect(this.constraints.isRecommendedSize(this.image)).to.be.false;
      });
    });
  });

  describe('.isLargeEnough()', function() {
    describe('given image size is 1000 and drive size is 1000', function() {
      before(function() {
        const drive = {
          size: 1000
        };
        this.constraints = new DriveConstraints(drive);
        this.image = {
          size: 1000
        };
      });
      it('should return true', function() {
        m.chai.expect(this.constraints.isLargeEnough(this.image)).to.be.true;
      });
    });

    describe('given image size is 1000 and drive size is 1001', function() {
      before(function() {
        const drive = {
          size: 1001
        };
        this.constraints = new DriveConstraints(drive);
        this.image = {
          size: 1000
        };
      });
      it('should return true', function() {
        m.chai.expect(this.constraints.isLargeEnough(this.image)).to.be.true;
      });
    });

    describe('given image size is 1001 and drive size is 1000', function() {
      before(function() {
        const drive = {
          size: 1000
        };
        this.constraints = new DriveConstraints(drive);
        this.image = {
          size: 1001
        };
      });
      it('should return false', function() {
        m.chai.expect(this.constraints.isLargeEnough(this.image)).to.be.false;
      });
    });
  });

  describe('.isLocked()', function() {

    describe('given drive.protected is undefined', function() {
      before(function() {
        const drive = {};
        this.constraints = new DriveConstraints(drive);
      });
      it('should return false', function() {
        m.chai.expect(this.constraints.isLocked()).to.be.false;
      });
    });

    describe('given drive.protected is false', function() {
      before(function() {
        const drive = {
          protected: false
        };
        this.constraints = new DriveConstraints(drive);
      });
      it('should return false', function() {
        m.chai.expect(this.constraints.isLocked()).to.be.false;
      });
    });

    describe('given drive.protected is true', function() {
      before(function() {
        const drive = {
          protected: true
        };
        this.constraints = new DriveConstraints(drive);
      });
      it('should return true', function() {
        m.chai.expect(this.constraints.isLocked()).to.be.true;
      });
    });
  });

  describe('.isValid()', function() {
    describe('given large enough drive', function() {
      before(function() {
        this.drive = {
          size: 2000
        };
        this.image = {
          size: 1000
        };
      });

      describe('given protected drive', function() {
        before(function() {
          this.drive.protected = true;
          this.constraints = new DriveConstraints(this.drive);
        });

        it('should return false', function() {
          m.chai.expect(this.constraints.isValid(this.image)).to.be.false;
        });
      });
      describe('given protected drive', function() {
        before(function() {
          this.drive.protected = false;
          this.constraints = new DriveConstraints(this.drive);
        });

        it('should return true', function() {
          m.chai.expect(this.constraints.isValid(this.image)).to.be.true;
        });
      });
    });

    describe('given smaller than image drive', function() {
      before(function() {
        this.drive = {
          size: 1000
        };
        this.image = {
          size: 2000
        };
      });

      describe('given protected drive', function() {
        before(function() {
          this.drive.protected = true;
          this.constraints = new DriveConstraints(this.drive);
        });

        it('should return false', function() {
          m.chai.expect(this.constraints.isValid(this.image)).to.be.false;
        });
      });
      describe('given unprotected image', function() {
        before(function() {
          this.drive.protected = false;
          this.constraints = new DriveConstraints(this.drive);
        });

        it('should return false', function() {
          m.chai.expect(this.constraints.isValid(this.image)).to.be.false;
        });
      });
    });
  });
});
