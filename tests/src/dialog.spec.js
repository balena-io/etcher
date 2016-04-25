'use strict';

const m = require('mochainon');
const electron = require('electron');
const dialog = require('../../lib/gui/dialog');

describe('Dialog:', function() {

  describe('.selectImage()', function() {

    describe('given the user does not select anything', function() {

      beforeEach(function() {
        this.showOpenDialogStub = m.sinon.stub(electron.dialog, 'showOpenDialog');
        this.showOpenDialogStub.yields(undefined);
      });

      afterEach(function() {
        this.showOpenDialogStub.restore();
      });

      it('should eventually be undefined', function() {
        const promise = dialog.selectImage();
        m.chai.expect(promise).to.eventually.be.undefined;
      });

    });

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
