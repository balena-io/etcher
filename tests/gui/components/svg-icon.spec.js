'use strict';

const m = require('mochainon');
const fs = require('fs');
const path = require('path');
const angular = require('angular');
require('angular-mocks');

describe('Browser: SVGIcon', function() {

  beforeEach(angular.mock.module(
    require('../../../lib/gui/components/svg-icon/svg-icon')
  ));

  describe('svgIcon', function() {

    let $compile;
    let $rootScope;

    beforeEach(angular.mock.inject(function(_$compile_, _$rootScope_, $templateCache) {
      $compile = _$compile_;
      $rootScope = _$rootScope_;

      // Workaround `Unexpected request: GET template.html. No more request expected` error.
      // See http://stackoverflow.com/a/29437480/1641422
      const templatePath = './components/svg-icon/templates/svg-icon.tpl.html';
      const template = fs.readFileSync(path.resolve('lib', 'gui', templatePath), {
        encoding: 'utf8'
      });
      $templateCache.put(templatePath, template);

    }));

    it('should inline the svg contents in the element', function() {
      const icon = '../../../../../lib/gui/assets/etcher.svg';
      let iconContents = fs.readFileSync(path.join(__dirname, '../../../lib/gui/assets/etcher.svg'), {
        encoding: 'utf8'
      }).split(/\r?\n/);

      // Injecting XML as HTML causes the XML header to be commented out.
      // Modify here to ease assertions later on.
      iconContents[0] = `<!--${iconContents[0].slice(1, iconContents[0].length - 1)}-->`;
      iconContents = iconContents.join('\n');

      const element = $compile(`<svg-icon path="${icon}">Resin.io</svg-icon>`)($rootScope);
      $rootScope.$digest();
      m.chai.expect(element.html()).to.equal(iconContents);
    });

    it('should inline raw svg contents in the element', function() {
      const svg = '<svg><text>Raspbian</text></svg>';
      const element = $compile(`<svg-icon path="${svg}"></svg-icon>`)($rootScope);
      $rootScope.$digest();
      m.chai.expect(element.html()).to.equal(svg);
    });

    it('should react to external updates', function() {
      const scope = $rootScope.$new();
      scope.name = 'Raspbian';
      scope.getSvg = () => {
        return `<svg><text>${scope.name}</text></svg>`;
      };

      const element = $compile('<svg-icon path="{{ getSvg() }}"></svg-icon>')(scope);
      $rootScope.$digest();
      m.chai.expect(element.html()).to.equal('<svg><text>Raspbian</text></svg>');

      scope.name = 'Resin.io';
      $rootScope.$digest();
      m.chai.expect(element.html()).to.equal('<svg><text>Resin.io</text></svg>');
    });

    it('should default the size to 40x40 pixels', function() {
      const icon = '../../../../../lib/gui/assets/etcher.svg';
      const element = $compile(`<svg-icon path="${icon}">Resin.io</svg-icon>`)($rootScope);
      $rootScope.$digest();
      m.chai.expect(element.css('width')).to.equal('40px');
      m.chai.expect(element.css('height')).to.equal('40px');
    });

    it('should be able to set a custom width', function() {
      const icon = '../../../../../lib/gui/assets/etcher.svg';
      const element = $compile(`<svg-icon path="${icon}" width="20px">Resin.io</svg-icon>`)($rootScope);
      $rootScope.$digest();
      m.chai.expect(element.css('width')).to.equal('20px');
      m.chai.expect(element.css('height')).to.equal('40px');
    });

    it('should be able to set a custom height', function() {
      const icon = '../../../../../lib/gui/assets/etcher.svg';
      const element = $compile(`<svg-icon path="${icon}" height="20px">Resin.io</svg-icon>`)($rootScope);
      $rootScope.$digest();
      m.chai.expect(element.css('width')).to.equal('40px');
      m.chai.expect(element.css('height')).to.equal('20px');
    });

  });

});
