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
const drivelist = require('drivelist');

describe('CLI: DriveScanner', function() {

  describe('given no available drives', function() {

    beforeEach(function() {
      this.scanner = require('../../lib/cli/drive-scanner');
      this.drivesListStub = m.sinon.stub(drivelist, 'list');
      this.drivesListStub.yields(null, []);
    });

    afterEach(function() {
      this.drivesListStub.restore();
    });

    it('should emit an empty array as `change`', function(done) {
      const spy = m.sinon.spy();
      this.scanner.on('change', spy);
      this.scanner.start();
      setTimeout(() => {
        m.chai.expect(spy.callCount).to.equal(1);
        m.chai.expect(spy.firstCall.args[0]).to.deep.equal([]);
        m.chai.expect(spy.firstCall.args[1]).to.equal(null);
        this.scanner.stop();
        done();
      }, 10);
    });

    it('it should not emit if not started', function(done) {
      const spy = m.sinon.spy();
      this.scanner.on('change', spy);
      setTimeout(() => {
        m.chai.expect(spy).to.not.have.been.called;
        done();
      }, 40);
    });

  });

  describe('given drives do not change', function() {
    beforeEach(function() {
      this.scanner = require('../../lib/cli/drive-scanner');
      this.drivesListStub = m.sinon.stub(drivelist, 'list');
      this.drivesListStub.yields(null, [ 'a', 'b' ]);
    });

    afterEach(function() {
      this.drivesListStub.restore();
    });

    it('should emit `change` only once', function(done) {
      const spy = m.sinon.spy();
      this.scanner.on('change', spy);
      this.scanner.start();
      setTimeout(() => {
        m.chai.expect(spy.callCount).to.equal(1);
        m.chai.expect(spy.firstCall.args[0]).to.deep.equal([ 'a', 'b' ]);
        m.chai.expect(spy.firstCall.args[1]).to.equal(null);
        this.scanner.stop();
        done();
      }, 40);
    });

  });

  describe('given drives change over time', function() {
    beforeEach(function() {
      this.scanner = require('../../lib/cli/drive-scanner');
      this.drivesListStub = m.sinon.stub(drivelist, 'list');
      this.drivesListStub.onCall(0).yields(null, [ 'a', 'b' ]);
      this.drivesListStub.onCall(1).yields(null, [ 'b', 'c' ]);
    });

    afterEach(function() {
      this.drivesListStub.restore();
    });

    it('should emit `change`', function(done) {
      const spy = m.sinon.spy();
      this.scanner.on('change', spy);
      this.scanner.start();
      setTimeout(() => {
        m.chai.expect(spy).to.have.been.called.twice;
        m.chai.expect(spy.secondCall.args[0]).to.deep.equal([ 'b', 'c' ]);
        m.chai.expect(spy.secondCall.args[1]).to.deep.equal([ 'a', 'b' ]);
        done();
      }, 40);
    });

  });

});
