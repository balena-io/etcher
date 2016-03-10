'use strict';

const m = require('mochainon');
const angular = require('angular');
require('angular-mocks');
require('../../../lib/browser/modules/notifier');

describe('Browser: Notifier', function() {

  beforeEach(angular.mock.module('Etcher.notifier'));

  describe('NotifierService', function() {

    let $rootScope;
    let NotifierService;

    beforeEach(angular.mock.inject(function(_$rootScope_, _NotifierService_) {
      $rootScope = _$rootScope_;
      NotifierService = _NotifierService_;
    }));

    it('should be able to emit an event without data', function() {
      let spy = m.sinon.spy();
      NotifierService.subscribe($rootScope, 'foobar', spy);
      NotifierService.emit('foobar');
      m.chai.expect(spy).to.have.been.calledOnce;
      m.chai.expect(spy).to.have.been.calledWith(undefined);
    });

    it('should be able to emit an event with data', function() {
      let spy = m.sinon.spy();
      NotifierService.subscribe($rootScope, 'foobar', spy);
      NotifierService.emit('foobar', 'Hello');
      m.chai.expect(spy).to.have.been.calledOnce;
      m.chai.expect(spy).to.have.been.calledWith('Hello');
    });

    it('should emit the correct event', function() {
      let spy1 = m.sinon.spy();
      let spy2 = m.sinon.spy();
      NotifierService.subscribe($rootScope, 'foobar', spy1);
      NotifierService.subscribe($rootScope, 'foobaz', spy2);
      NotifierService.emit('foobar');
      m.chai.expect(spy1).to.have.been.calledOnce;
      m.chai.expect(spy2).to.not.have.been.called;
    });

  });

});
