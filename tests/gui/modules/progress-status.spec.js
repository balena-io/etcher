'use strict'

const m = require('mochainon')
const settings = require('../../../lib/gui/app/models/settings')
const progressStatus = require('../../../lib/gui/app/modules/progress-status')

describe('Browser: progressStatus', function () {
  describe('.fromFlashState()', function () {
    beforeEach(function () {
      this.state = {
        type: 'write',
        percentage: 0,
        eta: 15,
        speed: 100000000000000
      }

      settings.set('unmountOnSuccess', true)
      settings.set('validateWriteOnSuccess', true)
    })

    it('should report 0% if percentage == 0 but speed != 0', function () {
      m.chai.expect(progressStatus.fromFlashState(this.state)).to.equal('0% Flashing')
    })

    it('should handle percentage == 0, type == write, unmountOnSuccess', function () {
      this.state.speed = 0
      m.chai.expect(progressStatus.fromFlashState(this.state)).to.equal('Starting...')
    })

    it('should handle percentage == 0, type == write, !unmountOnSuccess', function () {
      this.state.speed = 0
      settings.set('unmountOnSuccess', false)
      m.chai.expect(progressStatus.fromFlashState(this.state)).to.equal('Starting...')
    })

    it('should handle percentage == 0, type == check, unmountOnSuccess', function () {
      this.state.speed = 0
      this.state.type = 'check'
      m.chai.expect(progressStatus.fromFlashState(this.state)).to.equal('Validating...')
    })

    it('should handle percentage == 0, type == check, !unmountOnSuccess', function () {
      this.state.speed = 0
      this.state.type = 'check'
      settings.set('unmountOnSuccess', false)
      m.chai.expect(progressStatus.fromFlashState(this.state)).to.equal('Validating...')
    })

    it('should handle percentage == 50, type == write, unmountOnSuccess', function () {
      this.state.percentage = 50
      m.chai.expect(progressStatus.fromFlashState(this.state)).to.equal('50% Flashing')
    })

    it('should handle percentage == 50, type == write, !unmountOnSuccess', function () {
      this.state.percentage = 50
      settings.set('unmountOnSuccess', false)
      m.chai.expect(progressStatus.fromFlashState(this.state)).to.equal('50% Flashing')
    })

    it('should handle percentage == 50, type == check, unmountOnSuccess', function () {
      this.state.type = 'check'
      this.state.percentage = 50
      m.chai.expect(progressStatus.fromFlashState(this.state)).to.equal('50% Validating')
    })

    it('should handle percentage == 50, type == check, !unmountOnSuccess', function () {
      this.state.type = 'check'
      this.state.percentage = 50
      settings.set('unmountOnSuccess', false)
      m.chai.expect(progressStatus.fromFlashState(this.state)).to.equal('50% Validating')
    })

    it('should handle percentage == 100, type == write, unmountOnSuccess, validateWriteOnSuccess', function () {
      this.state.percentage = 100
      m.chai.expect(progressStatus.fromFlashState(this.state)).to.equal('Finishing...')
    })

    it('should handle percentage == 100, type == write, unmountOnSuccess, !validateWriteOnSuccess', function () {
      this.state.percentage = 100
      settings.set('validateWriteOnSuccess', false)
      m.chai.expect(progressStatus.fromFlashState(this.state)).to.equal('Unmounting...')
    })

    it('should handle percentage == 100, type == write, !unmountOnSuccess, !validateWriteOnSuccess', function () {
      this.state.percentage = 100
      settings.set('unmountOnSuccess', false)
      settings.set('validateWriteOnSuccess', false)
      m.chai.expect(progressStatus.fromFlashState(this.state)).to.equal('Finishing...')
    })

    it('should handle percentage == 100, type == check, unmountOnSuccess', function () {
      this.state.type = 'check'
      this.state.percentage = 100
      m.chai.expect(progressStatus.fromFlashState(this.state)).to.equal('Unmounting...')
    })

    it('should handle percentage == 100, type == check, !unmountOnSuccess', function () {
      this.state.type = 'check'
      this.state.percentage = 100
      settings.set('unmountOnSuccess', false)
      m.chai.expect(progressStatus.fromFlashState(this.state)).to.equal('Finishing...')
    })
  })
})
