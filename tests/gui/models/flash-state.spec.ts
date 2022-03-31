/*
 * Copyright 2016 balena.io
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

import * as flashState from '../../../lib/gui/app/models/flash-state';

describe('Model: flashState', function () {
	beforeEach(function () {
		flashState.resetState();
	});

	describe('flashState', function () {
		describe('.resetState()', function () {
			it('should be able to reset the progress state', function () {
				flashState.setFlashingFlag();
				flashState.setProgressState({
					failed: 0,
					type: 'flashing',
					percentage: 50,
					eta: 15,
					speed: 100000000000,
					averageSpeed: 100000000000,
					bytes: 0,
					position: 0,
					active: 0,
				});

				flashState.resetState();

				expect(flashState.getFlashState()).to.deep.equal({
					active: 0,
					failed: 0,
					percentage: 0,
					speed: null,
					averageSpeed: null,
				});
			});

			it('should be able to reset the progress state', function () {
				flashState.unsetFlashingFlag({
					cancelled: false,
					sourceChecksum: '1234',
				});

				flashState.resetState();
				expect(flashState.getFlashResults()).to.deep.equal({});
			});

			it('should unset the flashing flag', function () {
				flashState.setFlashingFlag();
				flashState.resetState();
				expect(flashState.isFlashing()).to.be.false;
			});

			it('should unset the flash uuid', function () {
				flashState.setFlashingFlag();
				flashState.resetState();
				expect(flashState.getFlashUuid()).to.be.undefined;
			});
		});

		describe('.isFlashing()', function () {
			it('should return false by default', function () {
				expect(flashState.isFlashing()).to.be.false;
			});

			it('should return true if flashing', function () {
				flashState.setFlashingFlag();
				expect(flashState.isFlashing()).to.be.true;
			});
		});

		describe('.setProgressState()', function () {
			it('should not allow setting the state if flashing is false', function () {
				flashState.unsetFlashingFlag({
					cancelled: false,
					sourceChecksum: '1234',
				});

				expect(function () {
					flashState.setProgressState({
						failed: 0,
						type: 'flashing',
						percentage: 50,
						eta: 15,
						speed: 100000000000,
						averageSpeed: 100000000000,
						bytes: 0,
						position: 0,
						active: 0,
					});
				}).to.throw("Can't set the flashing state when not flashing");
			});

			it('should not throw if percentage is 0', function () {
				flashState.setFlashingFlag();
				expect(function () {
					flashState.setProgressState({
						failed: 0,
						type: 'flashing',
						percentage: 0,
						eta: 15,
						speed: 100000000000,
						averageSpeed: 100000000000,
						bytes: 0,
						position: 0,
						active: 0,
					});
				}).to.not.throw('Missing flash fields: percentage');
			});

			it('should throw if percentage is outside maximum bound', function () {
				flashState.setFlashingFlag();
				expect(function () {
					flashState.setProgressState({
						failed: 0,
						type: 'flashing',
						percentage: 101,
						eta: 15,
						speed: 0,
						averageSpeed: 0,
						bytes: 0,
						position: 0,
						active: 0,
					});
				}).to.throw('Invalid state percentage: 101');
			});

			it('should throw if percentage is outside minimum bound', function () {
				flashState.setFlashingFlag();
				expect(function () {
					flashState.setProgressState({
						failed: 0,
						type: 'flashing',
						percentage: -1,
						eta: 15,
						speed: 0,
						averageSpeed: 0,
						bytes: 0,
						position: 0,
						active: 0,
					});
				}).to.throw('Invalid state percentage: -1');
			});

			it('should not throw if eta is equal to zero', function () {
				flashState.setFlashingFlag();
				expect(function () {
					flashState.setProgressState({
						failed: 0,
						type: 'flashing',
						percentage: 50,
						eta: 0,
						speed: 100000000000,
						averageSpeed: 100000000000,
						bytes: 0,
						position: 0,
						active: 0,
					});
				}).to.not.throw('Missing flash field eta');
			});

			it('should throw if eta is not a number', function () {
				flashState.setFlashingFlag();
				expect(function () {
					flashState.setProgressState({
						failed: 0,
						type: 'flashing',
						percentage: 50,
						// @ts-ignore
						eta: '15',
						speed: 100000000000,
						averageSpeed: 100000000000,
						bytes: 0,
						position: 0,
						active: 0,
					});
				}).to.throw('Invalid state eta: 15');
			});

			it('should throw if speed is missing', function () {
				flashState.setFlashingFlag();
				expect(function () {
					// @ts-ignore
					flashState.setProgressState({
						failed: 0,
						type: 'flashing',
						percentage: 50,
						eta: 15,
						averageSpeed: 0,
						bytes: 0,
						position: 0,
						active: 0,
					});
				}).to.throw('Missing flash fields: speed');
			});

			it('should not throw if speed is 0', function () {
				flashState.setFlashingFlag();
				expect(function () {
					flashState.setProgressState({
						failed: 0,
						type: 'flashing',
						percentage: 50,
						eta: 15,
						speed: 0,
						averageSpeed: 0,
						bytes: 0,
						position: 0,
						active: 0,
					});
				}).to.not.throw('Missing flash fields: speed');
			});

			it('should floor the percentage number', function () {
				flashState.setFlashingFlag();
				flashState.setProgressState({
					failed: 0,
					type: 'flashing',
					percentage: 50.253559459485,
					eta: 15,
					speed: 0,
					averageSpeed: 0,
					bytes: 0,
					position: 0,
					active: 0,
				});

				expect(flashState.getFlashState().percentage).to.equal(50);
			});

			it('should error when any field is non-nil but not a finite number', function () {
				expect(() => {
					flashState.setFlashingFlag();
					flashState.setProgressState({
						// @ts-ignore
						flashing: {},
						// @ts-ignore
						verifying: [],
						// @ts-ignore
						successful: true,
						// @ts-ignore
						failed: 'string',
						percentage: 0,
						eta: 0,
						speed: 0,
						averageSpeed: 0,
						bytes: 0,
						position: 0,
						active: 0,
						type: 'flashing',
					});
				}).to.throw('State quantity field(s) not finite number');
			});

			it('should not error when all quantity fields are zero', function () {
				expect(() => {
					flashState.setFlashingFlag();
					flashState.setProgressState({
						failed: 0,
						percentage: 0,
						eta: 0,
						speed: 0,
						averageSpeed: 0,
						bytes: 0,
						position: 0,
						active: 0,
						type: 'flashing',
					});
				}).to.not.throw();
			});
		});

		describe('.getFlashResults()', function () {
			it('should get the flash results', function () {
				flashState.setFlashingFlag();

				const expectedResults = {
					cancelled: false,
					sourceChecksum: '1234',
				};

				flashState.unsetFlashingFlag(expectedResults);
				const results = flashState.getFlashResults();
				expect(results).to.deep.equal(expectedResults);
			});
		});

		describe('.getFlashState()', function () {
			it('should initially return an empty state', function () {
				flashState.resetState();
				const currentFlashState = flashState.getFlashState();
				expect(currentFlashState).to.deep.equal({
					active: 0,
					failed: 0,
					percentage: 0,
					speed: null,
					averageSpeed: null,
				});
			});

			it('should return the current flash state', function () {
				const state = {
					failed: 0,
					percentage: 50,
					eta: 15,
					speed: 0,
					averageSpeed: 0,
					bytes: 0,
					position: 0,
					active: 0,
					type: 'flashing' as const,
				};

				flashState.setFlashingFlag();
				flashState.setProgressState(state);
				const currentFlashState = flashState.getFlashState();
				expect(currentFlashState).to.deep.equal({
					failed: 0,
					percentage: 50,
					eta: 15,
					speed: 0,
					averageSpeed: 0,
					bytes: 0,
					position: 0,
					active: 0,
					type: 'flashing',
				});
			});
		});

		describe('.unsetFlashingFlag()', function () {
			it('should throw if no flashing results', function () {
				expect(function () {
					// @ts-ignore
					flashState.unsetFlashingFlag();
				}).to.throw('Missing results');
			});

			it('should be able to set a string error code', function () {
				flashState.unsetFlashingFlag({
					cancelled: false,
					sourceChecksum: '1234',
					errorCode: 'EBUSY',
				});

				expect(flashState.getLastFlashErrorCode()).to.equal('EBUSY');
			});

			it('should be able to set a number error code', function () {
				flashState.unsetFlashingFlag({
					cancelled: false,
					sourceChecksum: '1234',
					errorCode: 123,
				});

				expect(flashState.getLastFlashErrorCode()).to.equal(123);
			});

			it('should throw if errorCode is not a number not a string', function () {
				expect(function () {
					flashState.unsetFlashingFlag({
						cancelled: false,
						sourceChecksum: '1234',
						// @ts-ignore
						errorCode: {
							name: 'EBUSY',
						},
					});
				}).to.throw('Invalid results errorCode: [object Object]');
			});

			it('should default cancelled to false', function () {
				flashState.unsetFlashingFlag({
					sourceChecksum: '1234',
				});

				const flashResults = flashState.getFlashResults();

				expect(flashResults).to.deep.equal({
					cancelled: false,
					skip: false,
					sourceChecksum: '1234',
				});
			});

			it('should throw if cancelled is not boolean', function () {
				expect(function () {
					flashState.unsetFlashingFlag({
						// @ts-ignore
						cancelled: 'false',
						sourceChecksum: '1234',
					});
				}).to.throw('Invalid results cancelled: false');
			});

			it('should throw if cancelled is true and sourceChecksum exists', function () {
				expect(function () {
					flashState.unsetFlashingFlag({
						cancelled: true,
						sourceChecksum: '1234',
					});
				}).to.throw(
					"The sourceChecksum value can't exist if the flashing was cancelled",
				);
			});

			it('should be able to set flashing to false', function () {
				flashState.unsetFlashingFlag({
					cancelled: false,
					sourceChecksum: '1234',
				});

				expect(flashState.isFlashing()).to.be.false;
			});

			it('should reset the flashing state', function () {
				flashState.setFlashingFlag();

				flashState.setProgressState({
					failed: 0,
					type: 'flashing',
					percentage: 50,
					eta: 15,
					speed: 100000000000,
					averageSpeed: 100000000000,
					bytes: 0,
					position: 0,
					active: 2,
				});

				expect(flashState.getFlashState()).to.not.deep.equal({
					failed: 0,
					percentage: 0,
					speed: 0,
					averageSpeed: 0,
				});

				flashState.unsetFlashingFlag({
					cancelled: false,
					sourceChecksum: '1234',
				});

				expect(flashState.getFlashState()).to.deep.equal({
					active: 0,
					failed: 0,
					percentage: 0,
					speed: null,
					averageSpeed: null,
				});
			});

			it('should not reset the flash uuid', function () {
				flashState.setFlashingFlag();
				const uuidBeforeUnset = flashState.getFlashUuid();

				flashState.unsetFlashingFlag({
					sourceChecksum: '1234',
					cancelled: false,
				});

				const uuidAfterUnset = flashState.getFlashUuid();
				expect(uuidBeforeUnset).to.equal(uuidAfterUnset);
			});
		});

		describe('.setFlashingFlag()', function () {
			it('should be able to set flashing to true', function () {
				flashState.setFlashingFlag();
				expect(flashState.isFlashing()).to.be.true;
			});

			it('should reset the flash results', function () {
				const expectedResults = {
					cancelled: false,
					sourceChecksum: '1234',
				};

				flashState.unsetFlashingFlag(expectedResults);
				const results = flashState.getFlashResults();
				expect(results).to.deep.equal(expectedResults);
				flashState.setFlashingFlag();
				expect(flashState.getFlashResults()).to.deep.equal({});
			});
		});

		describe('.wasLastFlashCancelled()', function () {
			it('should return false given a pristine state', function () {
				flashState.resetState();
				expect(flashState.wasLastFlashCancelled()).to.be.false;
			});

			it('should return false if !cancelled', function () {
				flashState.unsetFlashingFlag({
					sourceChecksum: '1234',
					cancelled: false,
				});

				expect(flashState.wasLastFlashCancelled()).to.be.false;
			});

			it('should return true if cancelled', function () {
				flashState.unsetFlashingFlag({
					cancelled: true,
				});

				expect(flashState.wasLastFlashCancelled()).to.be.true;
			});
		});

		describe('.getLastFlashSourceChecksum()', function () {
			it('should return undefined given a pristine state', function () {
				flashState.resetState();
				expect(flashState.getLastFlashSourceChecksum()).to.be.undefined;
			});

			it('should return the last flash source checksum', function () {
				flashState.unsetFlashingFlag({
					sourceChecksum: '1234',
					cancelled: false,
				});

				expect(flashState.getLastFlashSourceChecksum()).to.equal('1234');
			});

			it('should return undefined if the last flash was cancelled', function () {
				flashState.unsetFlashingFlag({
					cancelled: true,
				});

				expect(flashState.getLastFlashSourceChecksum()).to.be.undefined;
			});
		});

		describe('.getLastFlashErrorCode()', function () {
			it('should return undefined given a pristine state', function () {
				flashState.resetState();
				expect(flashState.getLastFlashErrorCode()).to.be.undefined;
			});

			it('should return the last flash error code', function () {
				flashState.unsetFlashingFlag({
					sourceChecksum: '1234',
					cancelled: false,
					errorCode: 'ENOSPC',
				});

				expect(flashState.getLastFlashErrorCode()).to.equal('ENOSPC');
			});

			it('should return undefined if the last flash did not report an error code', function () {
				flashState.unsetFlashingFlag({
					sourceChecksum: '1234',
					cancelled: false,
				});

				expect(flashState.getLastFlashErrorCode()).to.be.undefined;
			});
		});

		describe('.getFlashUuid()', function () {
			const UUID_REGEX =
				/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/;

			it('should be initially undefined', function () {
				expect(flashState.getFlashUuid()).to.be.undefined;
			});

			it('should be a valid uuid if the flashing flag is set', function () {
				flashState.setFlashingFlag();
				const uuid = flashState.getFlashUuid();
				expect(UUID_REGEX.test(uuid)).to.be.true;
			});

			it('should return different uuids every time the flashing flag is set', function () {
				flashState.setFlashingFlag();
				const uuid1 = flashState.getFlashUuid();
				flashState.unsetFlashingFlag({
					sourceChecksum: '1234',
					cancelled: false,
				});

				flashState.setFlashingFlag();
				const uuid2 = flashState.getFlashUuid();
				flashState.unsetFlashingFlag({
					cancelled: true,
				});

				flashState.setFlashingFlag();
				const uuid3 = flashState.getFlashUuid();
				flashState.unsetFlashingFlag({
					sourceChecksum: '1234',
					cancelled: false,
				});

				expect(UUID_REGEX.test(uuid1)).to.be.true;
				expect(UUID_REGEX.test(uuid2)).to.be.true;
				expect(UUID_REGEX.test(uuid3)).to.be.true;

				expect(uuid1).to.not.equal(uuid2);
				expect(uuid2).to.not.equal(uuid3);
				expect(uuid3).to.not.equal(uuid1);
			});
		});
	});
});
