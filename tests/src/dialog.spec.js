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

      it('should eventually equal the file', function(done) {
        dialog.selectImage().then(function(image) {
          m.chai.expect(image).to.equal('foo/bar');
          done();
        }).catch(done);
      });

    });

  });

});
