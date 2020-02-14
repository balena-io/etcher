/*
 * Copyright 2018 balena.io
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

import * as _debug from 'debug';
import * as electron from 'electron';
import { EventEmitter } from 'events';
import * as createInactivityTimer from 'inactivity-timer';

import * as settings from '../models/settings';
import { logException } from './analytics';

const debug = _debug('etcher:update-lock');

/**
 * Interaction timeout in milliseconds (defaults to 5 minutes)
 * @type {Number}
 * @constant
 */
const INTERACTION_TIMEOUT_MS = settings.has('interactionTimeout')
	? parseInt(settings.get('interactionTimeout'), 10)
	: 5 * 60 * 1000;

class UpdateLock extends EventEmitter {
	private paused: boolean;
	private lockTimer: any;

	constructor() {
		super();
		this.paused = false;
		this.on('inactive', UpdateLock.onInactive);
		this.lockTimer = createInactivityTimer(INTERACTION_TIMEOUT_MS, () => {
			debug('inactive');
			this.emit('inactive');
		});
	}

	/**
	 * @summary Inactivity event handler, releases the balena update lock on inactivity
	 */
	private static onInactive() {
		if (settings.get('resinUpdateLock')) {
			UpdateLock.check((checkError: Error, isLocked: boolean) => {
				debug('inactive-check', Boolean(checkError));
				if (checkError) {
					logException(checkError);
				}
				if (isLocked) {
					UpdateLock.release((error?: Error) => {
						debug('inactive-release', Boolean(error));
						if (error) {
							logException(error);
						}
					});
				}
			});
		}
	}

	/**
	 * @summary Acquire the update lock
	 */
	private static acquire(callback: (error?: Error) => void) {
		debug('lock');
		if (settings.get('resinUpdateLock')) {
			electron.ipcRenderer.once('resin-update-lock', (_event, error) => {
				callback(error);
			});
			electron.ipcRenderer.send('resin-update-lock', 'lock');
		} else {
			callback(new Error('Update lock disabled'));
		}
	}

	/**
	 * @summary Release the update lock
	 */
	public static release(callback: (error?: Error) => void) {
		debug('unlock');
		if (settings.get('resinUpdateLock')) {
			electron.ipcRenderer.once('resin-update-lock', (_event, error) => {
				callback(error);
			});
			electron.ipcRenderer.send('resin-update-lock', 'unlock');
		} else {
			callback(new Error('Update lock disabled'));
		}
	}

	/**
	 * @summary Check the state of the update lock
	 * @param {Function} callback - callback(error, isLocked)
	 * @example
	 * UpdateLock.check((error, isLocked) => {
	 *   if (isLocked) {
	 *     // ...
	 *   }
	 * })
	 */
	private static check(
		callback: (error: Error | null, isLocked?: boolean) => void,
	) {
		debug('check');
		if (settings.get('resinUpdateLock')) {
			electron.ipcRenderer.once(
				'resin-update-lock',
				(_event, error, isLocked) => {
					callback(error, isLocked);
				},
			);
			electron.ipcRenderer.send('resin-update-lock', 'check');
		} else {
			callback(new Error('Update lock disabled'));
		}
	}

	/**
	 * @summary Extend the lock timer
	 */
	public extend() {
		debug('extend');

		if (this.paused) {
			debug('extend:paused');
			return;
		}

		this.lockTimer.signal();

		// When extending, check that we have the lock,
		// and acquire it, if not
		if (settings.get('resinUpdateLock')) {
			UpdateLock.check((checkError, isLocked) => {
				if (checkError) {
					logException(checkError);
				}
				if (!isLocked) {
					UpdateLock.acquire(error => {
						if (error) {
							logException(error);
						}
						debug('extend-acquire', Boolean(error));
					});
				}
			});
		}
	}

	/**
	 * @summary Clear the lock timer
	 */
	private clearTimer() {
		debug('clear');
		this.lockTimer.clear();
	}

	/**
	 * @summary Clear the lock timer, and pause extension, avoiding triggering until resume()d
	 */
	public pause() {
		debug('pause');
		this.paused = true;
		this.clearTimer();
	}

	/**
	 * @summary Un-pause lock extension, and restart the timer
	 */
	public resume() {
		debug('resume');
		this.paused = false;
		this.extend();
	}
}

export const updateLock = new UpdateLock();
