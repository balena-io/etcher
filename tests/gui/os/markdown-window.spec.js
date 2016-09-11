/*
 * Copyright 2016 Resin.io
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *    http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

'use strict';

const m = require('mochainon');
const fs = require('fs');
const tmp = require('tmp');
const angular = require('angular');
require('angular-mocks');

describe('Browser: OSMarkdownWindow', function() {

  beforeEach(angular.mock.module(
    require('../../../lib/gui/os/markdown-window/markdown-window')
  ));

  describe('OSMarkdownWindowSafeBrowserWindowService', function() {

    let OSMarkdownWindowSafeBrowserWindowService;

    beforeEach(angular.mock.inject(function(_OSMarkdownWindowSafeBrowserWindowService_) {
      OSMarkdownWindowSafeBrowserWindowService = _OSMarkdownWindowSafeBrowserWindowService_;
    }));

    describe('.getInlineHtmlURL()', function() {

      it('should escape the input HTML', function() {
        const url = OSMarkdownWindowSafeBrowserWindowService.getInlineHtmlURL('<h1>Hello</h1>');
        m.chai.expect(url).to.equal('data:text/html;charset=utf-8,%3Ch1%3EHello%3C/h1%3E');
      });

    });

  });

  describe('OSMarkdownWindowParserService', function() {

    let $rootScope;
    let OSMarkdownWindowParserService;

    beforeEach(angular.mock.inject(function(_$rootScope_, _OSMarkdownWindowParserService_) {
      $rootScope = _$rootScope_;
      OSMarkdownWindowParserService = _OSMarkdownWindowParserService_;
    }));

    describe('.convertMarkdownToHtml()', function() {

      describe('given an inexistent stylesheet path', function() {

        it('should be rejected with an ENOENT error', function(done) {
          OSMarkdownWindowParserService.convertMarkdownToHtml('# Hello', 'foo/bar/baz.css').catch((error) => {
            m.chai.expect(error).to.be.an.instanceof(Error);
            m.chai.expect(error.code).to.equal('ENOENT');
            done();
          });

          setTimeout(() => {
            $rootScope.$apply();
          }, 500);
        });

      });

      describe('given a simple stylesheet', function() {

        beforeEach(function(done) {
          this.stylesheetPath = null;

          tmp.file((error, path, fd) => {
            if (error) {
              return done(error);
            }

            this.stylesheetPath = path;

            fs.writeFile(fd, [
              'html {',
              '  padding: 20px',
              '}',
              '',
              'p {',
              '  color: #fbfbfb',
              '}'
            ].join('\n'), done);
          });
        });

        it('should inline the stylesheet', function(done) {
          OSMarkdownWindowParserService.convertMarkdownToHtml('# Hello', this.stylesheetPath).then((html) => {
            m.chai.expect(html).to.equal([
              '<style>',
              'html {',
              '  padding: 20px',
              '}',
              '',
              'p {',
              '  color: #fbfbfb',
              '}',
              '</style>',
              '<h1 id="hello">Hello</h1>'
            ].join('\n'));
            done();
          });

          setTimeout(() => {
            $rootScope.$apply();
          }, 500);
        });

      });

    });

  });

});
