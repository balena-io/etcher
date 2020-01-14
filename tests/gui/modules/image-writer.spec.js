'use strict'

const _ = require('lodash')
const m = require('mochainon')
const ipc = require('node-ipc')
const Bluebird = require('bluebird')
// eslint-disable-next-line node/no-missing-require
const flashState = require('../../../lib/gui/app/models/flash-state')
// eslint-disable-next-line node/no-missing-require
const imageWriter = require('../../../lib/gui/app/modules/image-writer')

describe('Browser: imageWriter', () => {
  describe('.flash()', () => {
    describe('given a successful write', () => {
      beforeEach(() => {
        this.performWriteStub = m.sinon.stub(imageWriter, 'performWrite')
        this.performWriteStub.returns(Bluebird.resolve({
          cancelled: false,
          sourceChecksum: '1234'
        }))
      })

      afterEach(() => {
        this.performWriteStub.restore()
      })

      it('should set flashing to false when done', () => {
        flashState.unsetFlashingFlag({
          cancelled: false,
          sourceChecksum: '1234'
        })

        imageWriter.flash('foo.img', [ '/dev/disk2' ]).finally(() => {
          m.chai.expect(flashState.isFlashing()).to.be.false
        })
      })

      it('should prevent writing more than once', () => {
        flashState.unsetFlashingFlag({
          cancelled: false,
          sourceChecksum: '1234'
        })

        const writing = imageWriter.flash('foo.img', [ '/dev/disk2' ])
        imageWriter.flash('foo.img', [ '/dev/disk2' ]).catch(_.noop)
        writing.finally(() => {
          m.chai.expect(this.performWriteStub).to.have.been.calledOnce
        })
      })

      it('should reject the second flash attempt', () => {
        imageWriter.flash('foo.img', [ '/dev/disk2' ])

        let rejectError = null
        imageWriter.flash('foo.img', [ '/dev/disk2' ]).catch((error) => {
          rejectError = error
        }).finally(() => {
          m.chai.expect(rejectError).to.be.an.instanceof(Error)
          m.chai.expect(rejectError.message).to.equal('There is already a flash in progress')
        })
      })
    })

    describe('given an unsuccessful write', () => {
      beforeEach(() => {
        this.performWriteStub = m.sinon.stub(imageWriter, 'performWrite')
        this.error = new Error('write error')
        this.error.code = 'FOO'
        this.performWriteStub.returns(Bluebird.reject(this.error))
      })

      afterEach(() => {
        this.performWriteStub.restore()
      })

      it('should set flashing to false when done', () => {
        imageWriter.flash('foo.img', [ '/dev/disk2' ]).catch(_.noop).finally(() => {
          m.chai.expect(flashState.isFlashing()).to.be.false
        })
      })

      it('should set the error code in the flash results', () => {
        imageWriter.flash('foo.img', [ '/dev/disk2' ]).catch(_.noop).finally(() => {
          const flashResults = flashState.getFlashResults()
          m.chai.expect(flashResults.errorCode).to.equal('FOO')
        })
      })

      it('should be rejected with the error', () => {
        flashState.unsetFlashingFlag({
          cancelled: false,
          sourceChecksum: '1234'
        })

        let rejection
        imageWriter.flash('foo.img', [ '/dev/disk2' ]).catch((error) => {
          rejection = error
        }).finally(() => {
          m.chai.expect(rejection).to.be.an.instanceof(Error)
          m.chai.expect(rejection.message).to.equal('write error')
        })
      })
    })
  })

  describe('.performWrite()', function () {
    it('should set the ipc config to silent', function () {
      // Reset this value as it can persist from other tests
      m.chai.expect(ipc.config.silent).to.be.true
    })
  })
})
