/*
 * Copyright 2020 balena.io
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
import { Drive as DrivelistDrive } from 'drivelist';
import { sourceDestination } from 'etcher-sdk';
import * as ipc from 'node-ipc';
import { assert, SinonStub, stub } from 'sinon';

import * as flashState from '../../../lib/gui/app/models/flash-state';
import * as imageWriter from '../../../lib/gui/app/modules/image-writer';

// @ts-ignore
const fakeDrive: DrivelistDrive = {};

describe('Browser: imageWriter', () => {
	describe('.flash()', () => {
		const imagePath = 'foo.img';
		const sourceOptions = {
			imagePath,
			SourceType: sourceDestination.File,
		};

		describe('given a successful write', () => {
			let performWriteStub: SinonStub;

			beforeEach(() => {
				performWriteStub = stub();
				performWriteStub.returns(
					Promise.resolve({
						cancelled: false,
						sourceChecksum: '1234',
					}),
				);
			});

			afterEach(() => {
				performWriteStub.reset();
			});

			it('should set flashing to false when done', async () => {
				flashState.unsetFlashingFlag({
					cancelled: false,
					sourceChecksum: '1234',
				});

				try {
					await imageWriter.flash(
						imagePath,
						[fakeDrive],
						sourceOptions,
						performWriteStub,
					);
				} catch {
					// noop
				} finally {
					expect(flashState.isFlashing()).to.be.false;
				}
			});

			it('should prevent writing more than once', async () => {
				flashState.unsetFlashingFlag({
					cancelled: false,
					sourceChecksum: '1234',
				});

				try {
					await Promise.all([
						imageWriter.flash(
							imagePath,
							[fakeDrive],
							sourceOptions,
							performWriteStub,
						),
						imageWriter.flash(
							imagePath,
							[fakeDrive],
							sourceOptions,
							performWriteStub,
						),
					]);
					assert.fail('Writing twice should fail');
				} catch (error) {
					expect(error.message).to.equal(
						'There is already a flash in progress',
					);
				}
			});
		});

		describe('given an unsuccessful write', () => {
			let performWriteStub: SinonStub;

			beforeEach(() => {
				performWriteStub = stub();
				const error: Error & { code?: string } = new Error('write error');
				error.code = 'FOO';
				performWriteStub.returns(Promise.reject(error));
			});

			afterEach(() => {
				performWriteStub.reset();
			});

			it('should set flashing to false when done', async () => {
				try {
					await imageWriter.flash(
						imagePath,
						[fakeDrive],
						sourceOptions,
						performWriteStub,
					);
				} catch {
					// noop
				} finally {
					expect(flashState.isFlashing()).to.be.false;
				}
			});

			it('should set the error code in the flash results', async () => {
				try {
					await imageWriter.flash(
						imagePath,
						[fakeDrive],
						sourceOptions,
						performWriteStub,
					);
				} catch {
					// noop
				} finally {
					const flashResults = flashState.getFlashResults();
					expect(flashResults.errorCode).to.equal('FOO');
				}
			});

			it('should be rejected with the error', async () => {
				flashState.unsetFlashingFlag({
					cancelled: false,
					sourceChecksum: '1234',
				});
				try {
					await imageWriter.flash(
						imagePath,
						[fakeDrive],
						sourceOptions,
						performWriteStub,
					);
				} catch (error) {
					expect(error).to.be.an.instanceof(Error);
					expect(error.message).to.equal('write error');
				}
			});
		});
	});

	describe('.performWrite()', function () {
		it('should set the ipc config to silent', function () {
			// Reset this value as it can persist from other tests
			expect(ipc.config.silent).to.be.true;
		});
	});
});
