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

import * as settings from '../../../lib/gui/app/models/settings';

async function checkError(promise: Promise<any>, fn: (err: Error) => any) {
	try {
		await promise;
	} catch (error) {
		await fn(error);
		return;
	}
	throw new Error('Expected error was not thrown');
}

describe('Browser: settings', () => {
	it('should be able to set and read values', async () => {
		expect(await settings.get('foo')).to.be.undefined;
		await settings.set('foo', true);
		expect(await settings.get('foo')).to.be.true;
		await settings.set('foo', false);
		expect(await settings.get('foo')).to.be.false;
	});

	describe('.set()', () => {
		it('should not change the application state if storing to the local machine results in an error', async () => {
			await settings.set('foo', 'bar');
			expect(await settings.get('foo')).to.equal('bar');

			const writeConfigFileStub = stub();
			writeConfigFileStub.returns(Promise.reject(new Error('settings error')));

			const p = settings.set('foo', 'baz', writeConfigFileStub);
			await checkError(p, async (error) => {
				expect(error).to.be.an.instanceof(Error);
				expect(error.message).to.equal('settings error');
				expect(await settings.get('foo')).to.equal('bar');
			});
		});
	});

	describe('.set()', () => {
		it('should set an unknown key', async () => {
			expect(await settings.get('foobar')).to.be.undefined;
			await settings.set('foobar', true);
			expect(await settings.get('foobar')).to.be.true;
		});

		it('should set the key to undefined if no value', async () => {
			await settings.set('foo', 'bar');
			expect(await settings.get('foo')).to.equal('bar');
			await settings.set('foo', undefined);
			expect(await settings.get('foo')).to.be.undefined;
		});

		it('should store the setting to the local machine', async () => {
			const data = await settings.readAll();
			expect(data.foo).to.be.undefined;
			await settings.set('foo', 'bar');
			const data1 = await settings.readAll();
			expect(data1.foo).to.equal('bar');
		});

		it('should not change the application state if storing to the local machine results in an error', async () => {
			await settings.set('foo', 'bar');
			expect(await settings.get('foo')).to.equal('bar');

			const writeConfigFileStub = stub();
			writeConfigFileStub.returns(Promise.reject(new Error('settings error')));

			await checkError(
				settings.set('foo', 'baz', writeConfigFileStub),
				async (error) => {
					expect(error).to.be.an.instanceof(Error);
					expect(error.message).to.equal('settings error');
					expect(await settings.get('foo')).to.equal('bar');
				},
			);
		});
	});
});
