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
import * as _ from 'lodash';
import * as ipc from 'node-ipc';
import { assert, SinonStub, stub } from 'sinon';

import * as flashState from '../../../lib/gui/app/models/flash-state';
import * as imageWriter from '../../../lib/gui/app/modules/image-writer';

// @ts-ignore
const fakeDrive: DrivelistDrive = {};

describe('Browser: imageWriter', () => {
	describe('.flash()', () => {
		describe('given a successful write', () => {
			let performWriteStub: SinonStub;

			beforeEach(() => {
				performWriteStub = stub(imageWriter, 'performWrite');
				performWriteStub.returns(
					Promise.resolve({
						cancelled: false,
						sourceChecksum: '1234',
					}),
				);
			});

			afterEach(() => {
				performWriteStub.restore();
			});

			it('should set flashing to false when done', () => {
				flashState.unsetFlashingFlag({
					cancelled: false,
					sourceChecksum: '1234',
				});

				imageWriter.flash('foo.img', [fakeDrive]).finally(() => {
					expect(flashState.isFlashing()).to.be.false;
				});
			});

			it('should prevent writing more than once', () => {
				flashState.unsetFlashingFlag({
					cancelled: false,
					sourceChecksum: '1234',
				});

				const writing = imageWriter.flash('foo.img', [fakeDrive]);
				imageWriter.flash('foo.img', [fakeDrive]).catch(_.noop);
				writing.finally(() => {
					assert.calledOnce(performWriteStub);
				});
			});

			it('should reject the second flash attempt', () => {
				imageWriter.flash('foo.img', [fakeDrive]);

				let rejectError: Error;
				imageWriter
					.flash('foo.img', [fakeDrive])
					.catch(error => {
						rejectError = error;
					})
					.finally(() => {
						expect(rejectError).to.be.an.instanceof(Error);
						expect(rejectError!.message).to.equal(
							'There is already a flash in progress',
						);
					});
			});
		});

		describe('given an unsuccessful write', () => {
			let performWriteStub: SinonStub;

			beforeEach(() => {
				performWriteStub = stub(imageWriter, 'performWrite');
				const error: Error & { code?: string } = new Error('write error');
				error.code = 'FOO';
				performWriteStub.returns(Promise.reject(error));
			});

			afterEach(() => {
				performWriteStub.restore();
			});

			it('should set flashing to false when done', () => {
				imageWriter
					.flash('foo.img', [fakeDrive])
					.catch(_.noop)
					.finally(() => {
						expect(flashState.isFlashing()).to.be.false;
					});
			});

			it('should set the error code in the flash results', () => {
				imageWriter
					.flash('foo.img', [fakeDrive])
					.catch(_.noop)
					.finally(() => {
						const flashResults = flashState.getFlashResults();
						expect(flashResults.errorCode).to.equal('FOO');
					});
			});

			it('should be rejected with the error', () => {
				flashState.unsetFlashingFlag({
					cancelled: false,
					sourceChecksum: '1234',
				});

				let rejection: Error;
				imageWriter
					.flash('foo.img', [fakeDrive])
					.catch(error => {
						rejection = error;
					})
					.finally(() => {
						expect(rejection).to.be.an.instanceof(Error);
						expect(rejection!.message).to.equal('write error');
					});
			});
		});
	});

	describe('.performWrite()', function() {
		it('should set the ipc config to silent', function() {
			// Reset this value as it can persist from other tests
			expect(ipc.config.silent).to.be.true;
		});
	});
});
