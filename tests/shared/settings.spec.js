/*
 * Copyright 2016 resin.io
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
const _ = require('lodash');
const path = require('path');
const os = require('os');
const Bluebird = require('bluebird');
const fs = Bluebird.promisifyAll(require('fs'));
const tmp = require('tmp');
const settings = require('../../lib/shared/settings');
const errors = require('../../lib/shared/errors');
const packageJSON = require('../../package.json');

describe('Shared: Settings', function() {

  describe('.getConfigurationFilePath()', function() {

    it('should return an absolute path', function() {
      m.chai.expect(path.isAbsolute(settings.getConfigurationFilePath())).to.be.true;
    });

    it('should be a hidden file', function() {
      const file = path.basename(settings.getConfigurationFilePath());

      if (os.platform() === 'win32') {
        m.chai.expect(_.first(file)).to.equal('_');
      } else {
        m.chai.expect(_.first(file)).to.equal('.');
      }
    });

    it('should include the application name in the file name', function() {
      const file = path.basename(settings.getConfigurationFilePath());
      m.chai.expect(_.includes(file, packageJSON.name)).to.be.true;
    });

  });

  describe('.readAll()', function() {

    beforeEach(function() {
      this.configurationFilePath = tmp.fileSync().name;
    });

    afterEach(function() {
      return fs.unlinkAsync(this.configurationFilePath).catch({
        code: 'ENOENT'
      }, _.noop);
    });

    describe('given the file does not exist', function() {

      beforeEach(function() {
        fs.unlinkSync(this.configurationFilePath);
      });

      it('should resolve an empty object', function(done) {
        settings.readAll(this.configurationFilePath).then((data) => {
          m.chai.expect(data).to.deep.equal({});
          done();
        }).catch(done);
      });

    });

    describe('given an empty file', function() {

      beforeEach(function() {
        fs.writeFileSync(this.configurationFilePath, '');
      });

      it('should resolve an empty object', function(done) {
        settings.readAll(this.configurationFilePath).then((data) => {
          m.chai.expect(data).to.deep.equal({});
          done();
        }).catch(done);
      });

    });

    describe('given the file contains invalid data', function() {

      beforeEach(function() {
        fs.writeFileSync(this.configurationFilePath, '<foo>??');
      });

      it('should be rejected with a user error', function(done) {
        settings.readAll(this.configurationFilePath).catch((error) => {
          m.chai.expect(errors.isUserError(error)).to.be.true;
          m.chai.expect(error.message).to.equal(`Invalid settings in ${this.configurationFilePath}`);
          done();
        });
      });

    });

    _.each([
      'EPERM',
      'EACCES'
    ], (code) => {

      describe(`given reading the file throws ${code}`, function() {

        beforeEach(function() {
          this.fsReadFileStub = m.sinon.stub(fs, 'readFile');
          const error = new Error(code);
          error.code = code;
          this.fsReadFileStub.yields(error);
        });

        afterEach(function() {
          this.fsReadFileStub.restore();
        });

        it('should be rejected with a user error', function(done) {
          settings.readAll(this.configurationFilePath).catch((error) => {
            m.chai.expect(errors.isUserError(error)).to.be.true;
            m.chai.expect(error.message).to.equal(`Can't access settings in ${this.configurationFilePath}`);
            done();
          });
        });

      });

    });

    describe('given a file with settings', function() {

      beforeEach(function() {
        fs.writeFileSync(this.configurationFilePath, JSON.stringify({
          foo: 'bar',
          bar: 'baz',
          baz: 'qux'
        }));
      });

      it('should resolve the stored settings', function(done) {
        settings.readAll(this.configurationFilePath).then((data) => {
          m.chai.expect(data).to.deep.equal({
            foo: 'bar',
            bar: 'baz',
            baz: 'qux'
          });
          done();
        }).catch(done);
      });

    });

    describe('given a file with nested settings', function() {

      beforeEach(function() {
        fs.writeFileSync(this.configurationFilePath, JSON.stringify({
          foo: 'bar',
          bar: {
            baz: 'hey'
          },
          baz: [ 1, 2, 3 ]
        }));
      });

      it('should ignore the scalar types', function(done) {
        settings.readAll(this.configurationFilePath).then((data) => {
          m.chai.expect(data).to.deep.equal({
            foo: 'bar'
          });
          done();
        }).catch(done);
      });

    });

  });

  describe('.writeAll()', function() {

    beforeEach(function() {
      this.configurationFilePath = tmp.fileSync().name;
    });

    afterEach(function() {
      return fs.unlinkAsync(this.configurationFilePath).catch({
        code: 'ENOENT'
      }, _.noop);
    });

    describe('given the file does not exist', function() {

      beforeEach(function() {
        fs.unlinkSync(this.configurationFilePath);
      });

      it('should completely override the settings', function(done) {
        settings.writeAll(this.configurationFilePath, {
          hello: 'world'
        }).then(() => {
          return settings.readAll(this.configurationFilePath);
        }).then((data) => {
          m.chai.expect(data).to.deep.equal({
            hello: 'world'
          });
          done();
        }).catch(done);
      });

    });

    describe('given an empty file', function() {

      beforeEach(function() {
        fs.writeFileSync(this.configurationFilePath, '');
      });

      it('should completely override the settings', function(done) {
        settings.writeAll(this.configurationFilePath, {
          hello: 'world'
        }).then(() => {
          return settings.readAll(this.configurationFilePath);
        }).then((data) => {
          m.chai.expect(data).to.deep.equal({
            hello: 'world'
          });
          done();
        }).catch(done);
      });

    });

    describe('given a file with settings', function() {

      beforeEach(function() {
        fs.writeFileSync(this.configurationFilePath, JSON.stringify({
          foo: 'bar',
          bar: 'baz',
          baz: 'qux'
        }));
      });

      it('should completely override the settings', function(done) {
        settings.writeAll(this.configurationFilePath, {
          hello: 'world'
        }).then(() => {
          return settings.readAll(this.configurationFilePath);
        }).then((data) => {
          m.chai.expect(data).to.deep.equal({
            hello: 'world'
          });
          done();
        }).catch(done);
      });

      it('should delete settings set to undefined', function(done) {
        settings.writeAll(this.configurationFilePath, {
          foo: 'bar',
          bar: undefined,
          baz: 'qux'
        }).then(() => {
          return settings.readAll(this.configurationFilePath);
        }).then((data) => {
          m.chai.expect(data).to.deep.equal({
            foo: 'bar',
            baz: 'qux'
          });
          done();
        }).catch(done);
      });

    });

    describe('given the file contains invalid data', function() {

      beforeEach(function() {
        fs.writeFileSync(this.configurationFilePath, '<foo>??');
      });

      it('should completely override the settings', function(done) {
        settings.writeAll(this.configurationFilePath, {
          hello: 'world'
        }).then(() => {
          return settings.readAll(this.configurationFilePath);
        }).then((data) => {
          m.chai.expect(data).to.deep.equal({
            hello: 'world'
          });
          done();
        }).catch(done);
      });

    });

    describe('given there is an object value', function() {

      it('should be rejected with an error', function(done) {
        settings.writeAll(this.configurationFilePath, {
          foo: {
            bar: 'baz'
          }
        }).catch((error) => {
          m.chai.expect(errors.isUserError(error)).to.be.false;
          m.chai.expect(error.message).to.equal('Invalid settings');
          done();
        });
      });

    });

    describe('given there is an array value', function() {

      it('should be rejected with an error', function(done) {
        settings.writeAll(this.configurationFilePath, {
          foo: [ 'bar', 'baz' ]
        }).catch((error) => {
          m.chai.expect(errors.isUserError(error)).to.be.false;
          m.chai.expect(error.message).to.equal('Invalid settings');
          done();
        });
      });

    });

    describe('given the settings are not valid', function() {

      it('should be rejected with an error', function(done) {
        settings.writeAll(this.configurationFilePath, _.noop).catch((error) => {
          m.chai.expect(errors.isUserError(error)).to.be.false;
          m.chai.expect(error.message).to.equal('Invalid settings');
          done();
        });
      });

    });

    describe('given the settings are a string', function() {

      it('should be rejected with an error', function(done) {
        settings.writeAll(this.configurationFilePath, 'foo').catch((error) => {
          m.chai.expect(errors.isUserError(error)).to.be.false;
          m.chai.expect(error.message).to.equal('Invalid settings');
          done();
        });
      });

    });

    describe('given the settings are a number', function() {

      it('should be rejected with an error', function(done) {
        settings.writeAll(this.configurationFilePath, -456).catch((error) => {
          m.chai.expect(errors.isUserError(error)).to.be.false;
          m.chai.expect(error.message).to.equal('Invalid settings');
          done();
        });
      });

    });

    describe('given the settings are an array', function() {

      it('should be rejected with an error', function(done) {
        settings.writeAll(this.configurationFilePath, [ 1, 2, 3 ]).catch((error) => {
          m.chai.expect(errors.isUserError(error)).to.be.false;
          m.chai.expect(error.message).to.equal('Invalid settings');
          done();
        });
      });

    });

    _.each([
      'EPERM',
      'EACCES'
    ], (code) => {

      describe(`given writing the file throws ${code}`, function() {

        beforeEach(function() {
          this.fsWriteFileStub = m.sinon.stub(fs, 'writeFile');
          const error = new Error(code);
          error.code = code;
          this.fsWriteFileStub.yields(error);
        });

        afterEach(function() {
          this.fsWriteFileStub.restore();
        });

        it('should be rejected with a user error', function(done) {
          settings.writeAll(this.configurationFilePath, {
            foo: 'bar'
          }).catch((error) => {
            m.chai.expect(errors.isUserError(error)).to.be.true;
            m.chai.expect(error.message).to.equal(`Can't access settings in ${this.configurationFilePath}`);
            done();
          });
        });

      });

    });

  });

});
