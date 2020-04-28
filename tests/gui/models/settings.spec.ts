/*
 * Copyright 2017 balena.io
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

import { expect } from 'chai';
import * as _ from 'lodash';
import { stub } from 'sinon';

import * as localSettings from '../../../lib/gui/app/models/local-settings';
import * as settings from '../../../lib/gui/app/models/settings';

async function checkError(promise: Promise<any>, fn: (err: Error) => void) {
	try {
		await promise;
	} catch (error) {
		fn(error);
		return;
	}
	throw new Error('Expected error was not thrown');
}

describe('Browser: settings', function () {
	beforeEach(function () {
		return settings.reset();
	});

	const DEFAULT_SETTINGS = _.cloneDeep(settings.DEFAULT_SETTINGS);

	it('should be able to set and read values', function () {
		expect(settings.get('foo')).to.be.undefined;
		return settings
			.set('foo', true)
			.then(() => {
				expect(settings.get('foo')).to.be.true;
				return settings.set('foo', false);
			})
			.then(() => {
				expect(settings.get('foo')).to.be.false;
			});
	});

	describe('.reset()', function () {
		it('should reset the settings to their default values', function () {
			expect(settings.getAll()).to.deep.equal(DEFAULT_SETTINGS);
			return settings
				.set('foo', 1234)
				.then(() => {
					expect(settings.getAll()).to.not.deep.equal(DEFAULT_SETTINGS);
					return settings.reset();
				})
				.then(() => {
					expect(settings.getAll()).to.deep.equal(DEFAULT_SETTINGS);
				});
		});

		it('should reset the local settings to their default values', function () {
			return settings
				.set('foo', 1234)
				.then(localSettings.readAll)
				.then((data) => {
					expect(data).to.not.deep.equal(DEFAULT_SETTINGS);
					return settings.reset();
				})
				.then(localSettings.readAll)
				.then((data) => {
					expect(data).to.deep.equal(DEFAULT_SETTINGS);
				});
		});

		describe('given the local settings are cleared', function () {
			beforeEach(function () {
				return localSettings.clear();
			});

			it('should set the local settings to their default values', function () {
				return settings
					.reset()
					.then(localSettings.readAll)
					.then((data) => {
						expect(data).to.deep.equal(DEFAULT_SETTINGS);
					});
			});
		});
	});

	describe('.set()', function () {
		it('should store the settings to the local machine', function () {
			return localSettings
				.readAll()
				.then((data) => {
					expect(data.foo).to.be.undefined;
					expect(data.bar).to.be.undefined;
					return settings.set('foo', 'bar');
				})
				.then(() => {
					return settings.set('bar', 'baz');
				})
				.then(localSettings.readAll)
				.then((data) => {
					expect(data.foo).to.equal('bar');
					expect(data.bar).to.equal('baz');
				});
		});

		it('should not change the application state if storing to the local machine results in an error', async function () {
			await settings.set('foo', 'bar');
			expect(settings.get('foo')).to.equal('bar');

			const localSettingsWriteAllStub = stub(localSettings, 'writeAll');
			localSettingsWriteAllStub.returns(
				Promise.reject(new Error('localSettings error')),
			);

			await checkError(settings.set('foo', 'baz'), (error) => {
				expect(error).to.be.an.instanceof(Error);
				expect(error.message).to.equal('localSettings error');
				localSettingsWriteAllStub.restore();
				expect(settings.get('foo')).to.equal('bar');
			});
		});
	});

	describe('.load()', function () {
		it('should extend the application state with the local settings content', function () {
			const object = {
				foo: 'bar',
			};

			expect(settings.getAll()).to.deep.equal(DEFAULT_SETTINGS);

			return localSettings
				.writeAll(object)
				.then(() => {
					expect(settings.getAll()).to.deep.equal(DEFAULT_SETTINGS);
					return settings.load();
				})
				.then(() => {
					expect(settings.getAll()).to.deep.equal(
						_.assign({}, DEFAULT_SETTINGS, object),
					);
				});
		});

		it('should keep the application state intact if there are no local settings', function () {
			expect(settings.getAll()).to.deep.equal(DEFAULT_SETTINGS);
			return localSettings
				.clear()
				.then(settings.load)
				.then(() => {
					expect(settings.getAll()).to.deep.equal(DEFAULT_SETTINGS);
				});
		});
	});

	describe('.set()', function () {
		it('should set an unknown key', function () {
			expect(settings.get('foobar')).to.be.undefined;
			return settings.set('foobar', true).then(() => {
				expect(settings.get('foobar')).to.be.true;
			});
		});

		it('should set the key to undefined if no value', function () {
			return settings
				.set('foo', 'bar')
				.then(() => {
					expect(settings.get('foo')).to.equal('bar');
					return settings.set('foo', undefined);
				})
				.then(() => {
					expect(settings.get('foo')).to.be.undefined;
				});
		});

		it('should store the setting to the local machine', function () {
			return localSettings
				.readAll()
				.then((data) => {
					expect(data.foo).to.be.undefined;
					return settings.set('foo', 'bar');
				})
				.then(localSettings.readAll)
				.then((data) => {
					expect(data.foo).to.equal('bar');
				});
		});

		it('should not change the application state if storing to the local machine results in an error', async function () {
			await settings.set('foo', 'bar');
			expect(settings.get('foo')).to.equal('bar');

			const localSettingsWriteAllStub = stub(localSettings, 'writeAll');
			localSettingsWriteAllStub.returns(
				Promise.reject(new Error('localSettings error')),
			);

			await checkError(settings.set('foo', 'baz'), (error) => {
				expect(error).to.be.an.instanceof(Error);
				expect(error.message).to.equal('localSettings error');
				localSettingsWriteAllStub.restore();
				expect(settings.get('foo')).to.equal('bar');
			});
		});
	});

	describe('.getAll()', function () {
		it('should initial return all default values', function () {
			expect(settings.getAll()).to.deep.equal(DEFAULT_SETTINGS);
		});
	});
});
