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

import * as Immutable from 'immutable';
import * as _ from 'lodash';
import { basename } from 'path';
import * as redux from 'redux';
import { v4 as uuidV4 } from 'uuid';

import * as constraints from '../../../shared/drive-constraints';
import * as errors from '../../../shared/errors';
import * as utils from '../../../shared/utils';
import * as settings from './settings';

/**
 * @summary Verify and throw if any state fields are nil
 */
function verifyNoNilFields(
	object: _.Dictionary<any>,
	fields: string[],
	name: string,
) {
	const nilFields = _.filter(fields, (field) => {
		return _.isNil(_.get(object, field));
	});
	if (nilFields.length) {
		throw new Error(`Missing ${name} fields: ${nilFields.join(', ')}`);
	}
}

/**
 * @summary FLASH_STATE fields that can't be nil
 */
const flashStateNoNilFields = ['speed'];

/**
 * @summary SELECT_IMAGE fields that can't be nil
 */
const selectImageNoNilFields = ['path', 'extension'];

/**
 * @summary Application default state
 */
export const DEFAULT_STATE = Immutable.fromJS({
	applicationSessionUuid: '',
	flashingWorkflowUuid: '',
	availableDrives: [],
	selection: {
		devices: Immutable.OrderedSet(),
	},
	isFlashing: false,
	devicePaths: [],
	failedDeviceErrors: [],
	flashResults: {},
	flashState: {
		active: 0,
		failed: 0,
		percentage: 0,
		speed: null,
		averageSpeed: null,
	},
	lastAverageFlashingSpeed: null,
});

/**
 * @summary Application supported action messages
 */
export enum Actions {
	SET_DEVICE_PATHS,
	SET_FAILED_DEVICE_ERRORS,
	SET_AVAILABLE_TARGETS,
	SET_FLASH_STATE,
	RESET_FLASH_STATE,
	SET_FLASHING_FLAG,
	UNSET_FLASHING_FLAG,
	SELECT_TARGET,
	SELECT_SOURCE,
	DESELECT_TARGET,
	DESELECT_SOURCE,
	SET_APPLICATION_SESSION_UUID,
	SET_FLASHING_WORKFLOW_UUID,
}

interface Action {
	type: Actions;
	data: any;
}

/**
 * @summary Get available drives from the state
 *
 * @param {Object} state - state object
 * @returns {Object} new state
 */
function getAvailableDrives(state: typeof DEFAULT_STATE) {
	return state.get('availableDrives').toJS();
}

/**
 * @summary The redux store reducer
 */
function storeReducer(
	state = DEFAULT_STATE,
	action: Action,
): typeof DEFAULT_STATE {
	switch (action.type) {
		case Actions.SET_AVAILABLE_TARGETS: {
			// Type: action.data : Array<DriveObject>

			if (!action.data) {
				throw errors.createError({
					title: 'Missing drives',
				});
			}

			let drives = action.data;

			if (!_.isArray(drives) || !_.every(drives, _.isObject)) {
				throw errors.createError({
					title: `Invalid drives: ${drives}`,
				});
			}

			// Drives order is a list of devicePaths
			const drivesOrder = settings.getSync('drivesOrder') ?? [];

			drives = _.sortBy(drives, [
				// System drives last
				(d) => !!d.isSystem,
				// Devices with no devicePath first (usbboot)
				(d) => !!d.devicePath,
				// Sort as defined in the drivesOrder setting if there is one (only for Linux with udev)
				(d) => drivesOrder.indexOf(basename(d.devicePath || '')),
				// Then sort by devicePath (only available on Linux with udev) or device
				(d) => d.devicePath || d.device,
			]);

			const newState = state.set('availableDrives', Immutable.fromJS(drives));
			const selectedDevices = newState.getIn(['selection', 'devices']).toJS();

			// Remove selected drives that are stale, i.e. missing from availableDrives
			const nonStaleNewState = _.reduce(
				selectedDevices,
				(accState, device) => {
					// Check whether the drive still exists in availableDrives
					if (
						device &&
						!_.find(drives, {
							device,
						})
					) {
						// Deselect this drive gone from availableDrives
						return storeReducer(accState, {
							type: Actions.DESELECT_TARGET,
							data: device,
						});
					}

					return accState;
				},
				newState,
			);

			const shouldAutoselectAll = Boolean(
				settings.getSync('autoSelectAllDrives'),
			);
			const AUTOSELECT_DRIVE_COUNT = 1;
			const nonStaleSelectedDevices = nonStaleNewState
				.getIn(['selection', 'devices'])
				.toJS();
			const hasSelectedDevices =
				nonStaleSelectedDevices.length >= AUTOSELECT_DRIVE_COUNT;
			const shouldAutoselectOne =
				drives.length === AUTOSELECT_DRIVE_COUNT && !hasSelectedDevices;

			if (shouldAutoselectOne || shouldAutoselectAll) {
				// Even if there's no image selected, we need to call several
				// drive/image related checks, and `{}` works fine with them
				const image = state
					.getIn(['selection', 'image'], Immutable.fromJS({}))
					.toJS();

				return _.reduce(
					drives,
					(accState, drive) => {
						if (
							constraints.isDriveValid(drive, image) &&
							constraints.isDriveSizeRecommended(drive, image) &&
							// We don't want to auto-select large drives execpt is autoSelectAllDrives is true
							(!constraints.isDriveSizeLarge(drive) || shouldAutoselectAll) &&
							// We don't want to auto-select system drives
							!constraints.isSystemDrive(drive)
						) {
							// Auto-select this drive
							return storeReducer(accState, {
								type: Actions.SELECT_TARGET,
								data: drive.device,
							});
						}

						// Deselect this drive in case it still is selected
						return storeReducer(accState, {
							type: Actions.DESELECT_TARGET,
							data: drive.device,
						});
					},
					nonStaleNewState,
				);
			}

			return nonStaleNewState;
		}

		case Actions.SET_FLASH_STATE: {
			// Type: action.data : FlashStateObject

			if (!state.get('isFlashing')) {
				throw errors.createError({
					title: "Can't set the flashing state when not flashing",
				});
			}

			verifyNoNilFields(action.data, flashStateNoNilFields, 'flash');

			if (!_.every(_.pick(action.data, ['active', 'failed']), _.isFinite)) {
				throw errors.createError({
					title: 'State quantity field(s) not finite number',
				});
			}

			if (
				!_.isUndefined(action.data.percentage) &&
				!utils.isValidPercentage(action.data.percentage)
			) {
				throw errors.createError({
					title: `Invalid state percentage: ${action.data.percentage}`,
				});
			}

			if (!_.isUndefined(action.data.eta) && !_.isNumber(action.data.eta)) {
				throw errors.createError({
					title: `Invalid state eta: ${action.data.eta}`,
				});
			}

			let ret = state.set('flashState', Immutable.fromJS(action.data));
			if (action.data.type === 'flashing') {
				ret = ret.set('lastAverageFlashingSpeed', action.data.averageSpeed);
			}
			return ret;
		}

		case Actions.RESET_FLASH_STATE: {
			return state
				.set('isFlashing', false)
				.set('flashState', DEFAULT_STATE.get('flashState'))
				.set('flashResults', DEFAULT_STATE.get('flashResults'))
				.set('devicePaths', DEFAULT_STATE.get('devicePaths'))
				.set('failedDeviceErrors', DEFAULT_STATE.get('failedDeviceErrors'))
				.set(
					'lastAverageFlashingSpeed',
					DEFAULT_STATE.get('lastAverageFlashingSpeed'),
				)
				.delete('flashUuid');
		}

		case Actions.SET_FLASHING_FLAG: {
			return state
				.set('isFlashing', true)
				.set('flashUuid', uuidV4())
				.set('flashResults', DEFAULT_STATE.get('flashResults'));
		}

		case Actions.UNSET_FLASHING_FLAG: {
			// Type: action.data : FlashResultsObject

			if (!action.data) {
				throw errors.createError({
					title: 'Missing results',
				});
			}

			_.defaults(action.data, {
				cancelled: false,
				skip: false,
			});

			if (!_.isBoolean(action.data.cancelled)) {
				throw errors.createError({
					title: `Invalid results cancelled: ${action.data.cancelled}`,
				});
			}

			if (action.data.cancelled && action.data.sourceChecksum) {
				throw errors.createError({
					title:
						"The sourceChecksum value can't exist if the flashing was cancelled",
				});
			}

			if (
				action.data.sourceChecksum &&
				!_.isString(action.data.sourceChecksum)
			) {
				throw errors.createError({
					title: `Invalid results sourceChecksum: ${action.data.sourceChecksum}`,
				});
			}

			if (
				action.data.errorCode &&
				!_.isString(action.data.errorCode) &&
				!_.isNumber(action.data.errorCode)
			) {
				throw errors.createError({
					title: `Invalid results errorCode: ${action.data.errorCode}`,
				});
			}

			if (action.data.results) {
				action.data.results.averageFlashingSpeed = state.get(
					'lastAverageFlashingSpeed',
				);
			}

			if (action.data.skip) {
				return state
					.set('isFlashing', false)
					.set('flashResults', Immutable.fromJS(action.data));
			}

			return state
				.set('isFlashing', false)
				.set('flashResults', Immutable.fromJS(action.data))
				.set('flashState', DEFAULT_STATE.get('flashState'));
		}

		case Actions.SELECT_TARGET: {
			// Type: action.data : String

			const device = action.data;

			if (!device) {
				throw errors.createError({
					title: 'Missing drive',
				});
			}

			if (!_.isString(device)) {
				throw errors.createError({
					title: `Invalid drive: ${device}`,
				});
			}

			const selectedDrive = _.find(getAvailableDrives(state), { device });

			if (!selectedDrive) {
				throw errors.createError({
					title: `The drive is not available: ${device}`,
				});
			}

			if (selectedDrive.isReadOnly) {
				throw errors.createError({
					title: 'The drive is write-protected',
				});
			}

			const image = state.getIn(['selection', 'image']);
			if (
				image &&
				!constraints.isDriveLargeEnough(selectedDrive, image.toJS())
			) {
				throw errors.createError({
					title: 'The drive is not large enough',
				});
			}

			const selectedDevices = state.getIn(['selection', 'devices']);

			return state.setIn(['selection', 'devices'], selectedDevices.add(device));
		}

		// TODO(jhermsmeier): Consolidate these assertions
		// with image-stream / supported-formats, and have *one*
		// place where all the image extension / format handling
		// takes place, to avoid having to check 2+ locations with different logic
		case Actions.SELECT_SOURCE: {
			// Type: action.data : ImageObject

			if (!action.data.drive) {
				verifyNoNilFields(action.data, selectImageNoNilFields, 'image');
			}

			if (!_.isString(action.data.path)) {
				throw errors.createError({
					title: `Invalid image path: ${action.data.path}`,
				});
			}

			const MINIMUM_IMAGE_SIZE = 0;

			if (action.data.size !== undefined) {
				if (
					action.data.size < MINIMUM_IMAGE_SIZE ||
					!_.isInteger(action.data.size)
				) {
					throw errors.createError({
						title: `Invalid image size: ${action.data.size}`,
					});
				}
			}

			if (!_.isUndefined(action.data.compressedSize)) {
				if (
					action.data.compressedSize < MINIMUM_IMAGE_SIZE ||
					!_.isInteger(action.data.compressedSize)
				) {
					throw errors.createError({
						title: `Invalid image compressed size: ${action.data.compressedSize}`,
					});
				}
			}

			if (action.data.url && !_.isString(action.data.url)) {
				throw errors.createError({
					title: `Invalid image url: ${action.data.url}`,
				});
			}

			if (action.data.name && !_.isString(action.data.name)) {
				throw errors.createError({
					title: `Invalid image name: ${action.data.name}`,
				});
			}

			if (action.data.logo && !_.isString(action.data.logo)) {
				throw errors.createError({
					title: `Invalid image logo: ${action.data.logo}`,
				});
			}

			const selectedDevices = state.getIn(['selection', 'devices']);

			// Remove image-incompatible drives from selection with `constraints.isDriveValid`
			return _.reduce(
				selectedDevices.toJS(),
				(accState, device) => {
					const drive = _.find(getAvailableDrives(state), { device });
					if (
						!constraints.isDriveValid(drive, action.data) ||
						!constraints.isDriveSizeRecommended(drive, action.data)
					) {
						return storeReducer(accState, {
							type: Actions.DESELECT_TARGET,
							data: device,
						});
					}

					return accState;
				},
				state,
			).setIn(['selection', 'image'], Immutable.fromJS(action.data));
		}

		case Actions.DESELECT_TARGET: {
			// Type: action.data : String

			if (!action.data) {
				throw errors.createError({
					title: 'Missing drive',
				});
			}

			if (!_.isString(action.data)) {
				throw errors.createError({
					title: `Invalid drive: ${action.data}`,
				});
			}

			const selectedDevices = state.getIn(['selection', 'devices']);

			// Remove drive from set in state
			return state.setIn(
				['selection', 'devices'],
				selectedDevices.delete(action.data),
			);
		}

		case Actions.DESELECT_SOURCE: {
			return state.deleteIn(['selection', 'image']);
		}

		case Actions.SET_APPLICATION_SESSION_UUID: {
			return state.set('applicationSessionUuid', action.data);
		}

		case Actions.SET_FLASHING_WORKFLOW_UUID: {
			return state.set('flashingWorkflowUuid', action.data);
		}

		case Actions.SET_DEVICE_PATHS: {
			return state.set('devicePaths', action.data);
		}

		case Actions.SET_FAILED_DEVICE_ERRORS: {
			return state.set('failedDeviceErrors', action.data);
		}

		default: {
			return state;
		}
	}
}

export const store = redux.createStore(storeReducer, DEFAULT_STATE);

/**
 * @summary Observe the store for changes
 * @param {Function} onChange - change handler
 * @returns {Function} unsubscribe
 */
export function observe(onChange: (state: typeof DEFAULT_STATE) => void) {
	let currentState: typeof DEFAULT_STATE | null = null;

	/**
	 * @summary Internal change detection handler
	 */
	const changeHandler = () => {
		const nextState = store.getState();
		if (!_.isEqual(nextState, currentState)) {
			currentState = nextState;
			onChange(currentState);
		}
	};

	changeHandler();

	return store.subscribe(changeHandler);
}
