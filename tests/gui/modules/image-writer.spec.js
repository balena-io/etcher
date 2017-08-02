'use strict'

const m = require('mochainon')
const angular = require('angular')
const Bluebird = require('bluebird')
const flashState = require('../../../lib/shared/models/flash-state')
const imageWriter = require('../../../lib/gui/modules/image-writer')
require('angular-mocks')

describe('Browser: imageWriter', function () {
  describe('.flash()', function () {
    describe('given a successful write', function () {
      beforeEach(function () {
        this.performWriteStub = m.sinon.stub(imageWriter, 'performWrite')
        this.performWriteStub.returns(Bluebird.resolve({
          cancelled: false,
          sourceChecksum: '1234'
        }))
      })

      afterEach(function () {
        this.performWriteStub.restore()
      })

      it('should set flashing to false when done', function () {
        flashState.unsetFlashingFlag({
          cancelled: false,
          sourceChecksum: '1234'
        })

        imageWriter.flash('foo.img', '/dev/disk2').finally(() => {
          m.chai.expect(flashState.isFlashing()).to.be.false
        })
      })

      it('should prevent writing more than once', function () {
        flashState.unsetFlashingFlag({
          cancelled: false,
          sourceChecksum: '1234'
        })

        const writing = imageWriter.flash('foo.img', '/dev/disk2')
        imageWriter.flash('foo.img', '/dev/disk2').catch(angular.noop)
        writing.finally(() => {
          m.chai.expect(this.performWriteStub).to.have.been.calledOnce
        })
      })

      it('should reject the second flash attempt', function () {
        imageWriter.flash('foo.img', '/dev/disk2')

        let rejectError = null
        imageWriter.flash('foo.img', '/dev/disk2').catch(function (error) {
          rejectError = error
        }).finally(() => {
          m.chai.expect(rejectError).to.be.an.instanceof(Error)
          m.chai.expect(rejectError.message).to.equal('There is already a flash in progress')
        })
      })
    })

    describe('given an unsuccessful write', function () {
      beforeEach(function () {
        this.performWriteStub = m.sinon.stub(imageWriter, 'performWrite')
        this.error = new Error('write error')
        this.error.code = 'FOO'
        this.performWriteStub.returns(Bluebird.reject(this.error))
      })

      afterEach(function () {
        this.performWriteStub.restore()
      })

      it('should set flashing to false when done', function () {
        imageWriter.flash('foo.img', '/dev/disk2').catch(angular.noop).finally(() => {
          m.chai.expect(flashState.isFlashing()).to.be.false
        })
      })

      it('should set the error code in the flash results', function () {
        imageWriter.flash('foo.img', '/dev/disk2').catch(angular.noop).finally(() => {
          const flashResults = flashState.getFlashResults()
          m.chai.expect(flashResults.errorCode).to.equal('FOO')
        })
      })

      it('should be rejected with the error', function () {
        flashState.unsetFlashingFlag({
          cancelled: false,
          sourceChecksum: '1234'
        })

        let rejection
        imageWriter.flash('foo.img', '/dev/disk2').catch(function (error) {
          rejection = error
        }).finally(() => {
          m.chai.expect(rejection).to.be.an.instanceof(Error)
          m.chai.expect(rejection.message).to.equal('write error')
        })
      })
    })
  })
})
