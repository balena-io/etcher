'use strict'

const _ = require('lodash')
const m = require('mochainon')

// This module depends on the ETCHER_TEST env var being true to be testable
const mockedIpc = require('../../../lib/shared/ipc')
const angular = require('angular')
const Bluebird = require('bluebird')
const flashState = require('../../../lib/shared/models/flash-state')
const imageWriter = require('../../../lib/gui/app/modules/image-writer')
const permissions = require('../../../lib/shared/permissions')
const analytics = require('../../../lib/gui/app/modules/analytics')
require('angular-mocks')

describe('Browser: imageWriter', () => {
  describe('.flash()', () => {
    describe('given a successful write', () => {
      beforeEach(function () {
        this.performWriteStub = m.sinon.stub(imageWriter, 'performWrite')
        this.performWriteStub.returns(Bluebird.resolve({
          cancelled: false,
          sourceChecksum: '1234'
        }))
        this.analyticsLogEventStub = m.sinon.stub(analytics, 'logEvent')
      })

      afterEach(function () {
        this.performWriteStub.restore()
        this.analyticsLogEventStub.restore()
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
        imageWriter.flash('foo.img', [ '/dev/disk2' ]).catch(angular.noop)
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

      it('should log success events', function (done) {
        imageWriter.flash('foo.img', [ '/dev/disk2' ]).then(() => {
          m.chai.expect(this.analyticsLogEventStub).to.have.been.calledWith('Done')
          done()
        })

        m.chai.expect(this.analyticsLogEventStub).to.have.been.calledWith('Flash')
      })
    })

    describe('given an unsuccessful write', () => {
      beforeEach(() => {
        this.performWriteStub = m.sinon.stub(imageWriter, 'performWrite')
        this.error = new Error('write error')
        this.error.code = 'FOO'
        this.performWriteStub.returns(Bluebird.reject(this.error))
        this.analyticsLogEventStub = m.sinon.stub(analytics, 'logEvent')
      })

      afterEach(() => {
        this.performWriteStub.restore()
        this.analyticsLogEventStub.restore()
      })

      it('should set flashing to false when done', () => {
        imageWriter.flash('foo.img', [ '/dev/disk2' ]).catch(angular.noop).finally(() => {
          m.chai.expect(flashState.isFlashing()).to.be.false
        })
      })

      it('should set the error code in the flash results', () => {
        imageWriter.flash('foo.img', [ '/dev/disk2' ]).catch(angular.noop).finally(() => {
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

      it('should handle a generic error', (done) => {
        imageWriter.flash('foo.img', [ '/dev/disk2' ]).catch(() => {
          m.chai.expect(this.analyticsLogEventStub).to.have.been.calledWith('Flash error')
          done()
        })
      })
    })
  })

  describe('.performWrite()', function () {
    this.image = 'foo.img'
    this.destinations = [ '/dev/disk2' ]
    this.results = {
      cancelled: false
    }

    beforeEach(function () {
      m.sinon.stub(permissions, 'elevateCommand', () => {
        return Bluebird.resolve(this.results)
      })
    })

    afterEach(function () {
      mockedIpc.config = {}
      mockedIpc.mockEvents = {}
      mockedIpc.server = false
      permissions.elevateCommand.restore()
    })

    it('should set the ipc config to silent', function () {
      // Reset this value as it can persist from other tests
      mockedIpc.config.silent = false
      imageWriter.performWrite(undefined, undefined, undefined).cancel()
      m.chai.expect(mockedIpc.config.silent).to.be.true
    })

    it('should handle error event', function () {
      imageWriter.performWrite(this.image, this.destinations, _.noop)
      m.chai.expect(mockedIpc.mockEvents).to.have.property('error').that.is.lengthOf(1)
    })

    it('should handle log event', function () {
      imageWriter.performWrite(this.image, this.destinations, _.noop)
      m.chai.expect(mockedIpc.mockEvents).to.have.property('log').that.is.lengthOf(1)
    })

    it('should handle fail event', function () {
      imageWriter.performWrite(this.image, this.destinations, _.noop)
      m.chai.expect(mockedIpc.mockEvents).to.have.property('fail').that.is.lengthOf(1)
    })

    it('should handle done event', function () {
      imageWriter.performWrite(this.image, this.destinations, _.noop)
      m.chai.expect(mockedIpc.mockEvents).to.have.property('done').that.is.lengthOf(1)
    })

    it('should handle state event', function () {
      imageWriter.performWrite(this.image, this.destinations, _.noop)
      m.chai.expect(mockedIpc.mockEvents).to.have.property('state').that.is.lengthOf(1)
    })

    it('should handle ready event', function () {
      imageWriter.performWrite(this.image, this.destinations, _.noop)
      m.chai.expect(mockedIpc.mockEvents).to.have.property('ready').that.is.lengthOf(1)
    })

    it('should handle start event', function () {
      imageWriter.performWrite(this.image, this.destinations, _.noop)
      m.chai.expect(mockedIpc.mockEvents).to.have.property('start').that.is.lengthOf(1)
    })

    it('should call onProgress on a state event', function (done) {
      imageWriter.performWrite(this.image, this.destinations, (state) => {
        m.chai.expect(state).to.be.true
        done()
      })
      mockedIpc.emitFromServer('state', true)
    })

    it('should call onProgress on a state event', function (done) {
      imageWriter.performWrite(this.image, this.destinations, (state) => {
        m.chai.expect(state).to.be.true
        done()
      })
      mockedIpc.emitFromServer('state', true)
    })

    it('should call elevateCommand on start', function () {
      imageWriter.performWrite(this.image, this.destinations, _.noop)
      m.chai.expect(permissions.elevateCommand).to.have.been.called
    })

    it('should emit write command on ready', function () {
      imageWriter.performWrite(this.image, this.destinations, _.noop)
      mockedIpc.emitFromServer('ready')
      m.chai.expect(mockedIpc.server.mockEmissions.write).to.deep.equal([ {
        imagePath: this.image,
        destinations: this.destinations,
        unmountOnSuccess: true,
        validateWriteOnSuccess: true,
        checksumAlgorithms: [ 'sha512' ]
      } ])
    })

    it('should reject on an error', function (done) {
      imageWriter.performWrite(this.image, this.destinations, _.noop).catch((error) => {
        m.chai.expect(error.message).to.equal('some error')
        done()
      })
      mockedIpc.emitFromServer('error', new Error('some error'))
    })

    it('should terminate server on an error', function () {
      imageWriter.performWrite(this.image, this.destinations, _.noop).catch(() => {
        _.each(mockedIpc.server.sockets, (socket) => {
          m.chai.expect(socket.destroyed).to.be.true
        })
        m.chai.expect(mockedIpc.server.mockStopCalled).to.be.true
      })
      mockedIpc.emitFromServer('error', new Error('some error'))
    })
  })
})
