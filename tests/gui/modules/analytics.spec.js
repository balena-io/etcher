'use strict';

const m = require('mochainon');
const angular = require('angular');
require('angular-mocks');

describe('Browser: Analytics', function() {

  beforeEach(angular.mock.module(
    require('../../../lib/gui/modules/analytics')
  ));

  describe('AnalyticsService', function() {

    let AnalyticsService;

    beforeEach(angular.mock.inject(function(_AnalyticsService_) {
      AnalyticsService = _AnalyticsService_;
    }));

    describe('.shouldReportError()', function() {

      it('should return true for a basic error', function() {
        const error = new Error('foo');
        m.chai.expect(AnalyticsService.shouldReportError(error)).to.be.true;
      });

      it('should return true for an error with a report true property', function() {
        const error = new Error('foo');
        error.report = true;
        m.chai.expect(AnalyticsService.shouldReportError(error)).to.be.true;
      });

      it('should return false for an error with a report false property', function() {
        const error = new Error('foo');
        error.report = false;
        m.chai.expect(AnalyticsService.shouldReportError(error)).to.be.false;
      });

      it('should return false for an error with a report undefined property', function() {
        const error = new Error('foo');
        error.report = undefined;
        m.chai.expect(AnalyticsService.shouldReportError(error)).to.be.false;
      });

      it('should return false for an error with a report null property', function() {
        const error = new Error('foo');
        error.report = null;
        m.chai.expect(AnalyticsService.shouldReportError(error)).to.be.false;
      });

      it('should return false for an error with a report 0 property', function() {
        const error = new Error('foo');
        error.report = 0;
        m.chai.expect(AnalyticsService.shouldReportError(error)).to.be.false;
      });

      it('should return true for an error with a report 1 property', function() {
        const error = new Error('foo');
        error.report = 1;
        m.chai.expect(AnalyticsService.shouldReportError(error)).to.be.true;
      });

      it('should cast the report property to boolean', function() {
        const error = new Error('foo');
        error.report = '';
        m.chai.expect(AnalyticsService.shouldReportError(error)).to.be.false;
      });

    });

  });
});
