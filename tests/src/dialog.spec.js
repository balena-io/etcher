'use strict';

const m = require('mochainon');
const electron = require('electron');
const dialog = require('../../lib/src/dialog');

describe('Dialog:', function() {

  describe('.selectImage()', function() {

    describe('given the users performs a selection', function() {

      beforeEach(function() {
        this.showOpenDialogStub = m.sinon.stub(electron.dialog, 'showOpenDialog');
        this.showOpenDialogStub.yields([ 'foo/bar' ]);
      });

      afterEach(function() {
        this.showOpenDialogStub.restore();
      });

      it('should eventually equal the file', function() {
        const promise = dialog.selectImage();
        m.chai.expect(promise).to.eventually.equal('foo/bar');
      });

    });

  });

});
