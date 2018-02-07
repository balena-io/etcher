
const m = require('mochainon')

describe('Browser: Modal', function () {
  beforeEach(angular.mock.module(
    require('../../../lib/gui/app/components/modal/modal')
  ))

  describe('ModalService', function () {
    let ModalService

    beforeEach(angular.mock.inject(function (_ModalService_) {
      ModalService = _ModalService_
    }))

    describe('.open()', function () {
      it('should not emit any errors when the template is a non-empty string', function () {
        m.chai.expect(function () {
          ModalService.open({
            template: '<div>{{ \'Hello\' }}, World!</div>'
          })
        }).to.not.throw()
      })

      it('should emit error on no template field', function () {
        m.chai.expect(function () {
          ModalService.open({})
        }).to.throw('One of component or template or templateUrl options is required.')
      })

      it('should emit error on empty string template', function () {
        m.chai.expect(function () {
          ModalService.open({
            template: ''
          })
        }).to.throw('One of component or template or templateUrl options is required.')
      })
    })
  })
})
