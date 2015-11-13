var m = require('mochainon');
var electronDialog = require('dialog');
var dialog = require('../../lib/src/dialog');

describe('Dialog:', function() {
  'use strict';

  describe('.selectImage()', function() {

    describe('given the users performs a selection', function() {

      beforeEach(function() {
        this.showOpenDialogStub = m.sinon.stub(electronDialog, 'showOpenDialog');
        this.showOpenDialogStub.yields([ 'foo/bar' ]);
      });

      afterEach(function() {
        this.showOpenDialogStub.restore();
      });

      it('should eventually equal the file', function() {
        var promise = dialog.selectImage();
        m.chai.expect(promise).to.eventually.equal('foo/bar');
      });

    });

  });

});
