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

import * as electron from 'electron';
import * as remote from '@electron/remote';
import { debounce, capitalize, Dictionary, values } from 'lodash';
import outdent from 'outdent';
import * as React from 'react';
import * as ReactDOM from 'react-dom';
import { v4 as uuidV4 } from 'uuid';

import * as packageJSON from '../../../package.json';
import { DrivelistDrive } from '../../shared/drive-constraints';
import * as EXIT_CODES from '../../shared/exit-codes';
import * as messages from '../../shared/messages';
import * as availableDrives from './models/available-drives';
import * as flashState from './models/flash-state';
import * as settings from './models/settings';
import { Actions, observe, store } from './models/store';
import * as analytics from './modules/analytics';
import { startApiAndSpawnChild } from './modules/api';
import * as exceptionReporter from './modules/exception-reporter';
import * as osDialog from './os/dialog';
import * as windowProgress from './os/window-progress';
import MainPage from './pages/main/MainPage';
import './css/main.css';
import * as i18next from 'i18next';
import { promises } from 'dns';
import { SourceMetadata } from '../../shared/typings/source-selector';

window.addEventListener(
	'unhandledrejection',
	(event: PromiseRejectionEvent | any) => {
		// Promise: event.reason
		// Anything else: event
		const error = event.reason || event;
		analytics.logException(error);
		event.preventDefault();
	},
);

// Set application session UUID
store.dispatch({
	type: Actions.SET_APPLICATION_SESSION_UUID,
	data: uuidV4(),
});

// Set first flashing workflow UUID
store.dispatch({
	type: Actions.SET_FLASHING_WORKFLOW_UUID,
	data: uuidV4(),
});

const applicationSessionUuid = store.getState().toJS().applicationSessionUuid;
const flashingWorkflowUuid = store.getState().toJS().flashingWorkflowUuid;

console.log(outdent`
	${outdent}
	 _____ _       _
	|  ___| |     | |
	| |__ | |_ ___| |__   ___ _ __
	|  __|| __/ __| '_ \\ / _ \\ '__|
	| |___| || (__| | | |  __/ |
	\\____/ \\__\\___|_| |_|\\___|_|

	Interested in joining the Etcher team?
	Drop us a line at join+etcher@balena.io

	Version = ${packageJSON.version}, Type = ${packageJSON.packageType}
`);

const currentVersion = packageJSON.version;

analytics.logEvent('Application start', {
	packageType: packageJSON.packageType,
	version: currentVersion,
});

const debouncedLog = debounce(console.log, 1000, { maxWait: 1000 });

function pluralize(word: string, quantity: number) {
	return `${quantity} ${word}${quantity === 1 ? '' : 's'}`;
}

observe(() => {
	if (!flashState.isFlashing()) {
		return;
	}
	const currentFlashState = flashState.getFlashState();
	windowProgress.set(currentFlashState);

	let eta = '';
	if (currentFlashState.eta !== undefined) {
		eta = `eta in ${currentFlashState.eta.toFixed(0)}s`;
	}
	let active = '';
	if (currentFlashState.type !== 'decompressing') {
		active = pluralize('device', currentFlashState.active);
	}
	// NOTE: There is usually a short time period between the `isFlashing()`
	// property being set, and the flashing actually starting, which
	// might cause some non-sense flashing state logs including
	// `undefined` values.
	debouncedLog(outdent({ newline: ' ' })`
		${capitalize(currentFlashState.type)}
		${active},
		${currentFlashState.percentage}%
		at
		${(currentFlashState.speed || 0).toFixed(2)}
		MB/s
		(total ${(currentFlashState.speed * currentFlashState.active).toFixed(2)} MB/s)
		${eta}
		with
		${pluralize('failed device', currentFlashState.failed)}
	`);
});

function setDrives(drives: Dictionary<DrivelistDrive>) {
	// prevent setting drives while flashing otherwise we might lose some while we unmount them
	if (!flashState.isFlashing()) {
		availableDrives.setDrives(values(drives));
	}
}

// Spwaning the child process without privileges to get the drives list
// TODO: clean up this mess of exports
export let requestMetadata: any;

// start the api and spawn the child process
startApiAndSpawnChild({
	withPrivileges: false,
}).then(({ emit, registerHandler }) => {
	// start scanning
	emit('scan');

	// make the sourceMetada awaitable to be used on source selection
	requestMetadata = async (params: any): Promise<SourceMetadata> => {
		emit('sourceMetadata', JSON.stringify(params));

		return new Promise((resolve) =>
			registerHandler('sourceMetadata', (data: any) => {
				resolve(JSON.parse(data));
			}),
		);
	};

	registerHandler('drives', (data: any) => {
		setDrives(JSON.parse(data));
	});
});

let popupExists = false;

analytics.initAnalytics();

window.addEventListener('beforeunload', async (event) => {
	if (!flashState.isFlashing() || popupExists) {
		analytics.logEvent('Close application', {
			isFlashing: flashState.isFlashing(),
		});
		return;
	}

	// Don't close window while flashing
	event.returnValue = false;

	// Don't open any more popups
	popupExists = true;

	analytics.logEvent('Close attempt while flashing');

	try {
		const confirmed = await osDialog.showWarning({
			confirmationLabel: i18next.t('yesExit'),
			rejectionLabel: i18next.t('cancel'),
			title: i18next.t('reallyExit'),
			description: messages.warning.exitWhileFlashing(),
		});
		if (confirmed) {
			analytics.logEvent('Close confirmed while flashing', {
				flashInstanceUuid: flashState.getFlashUuid(),
			});

			// This circumvents the 'beforeunload' event unlike
			// remote.app.quit() which does not.
			remote.process.exit(EXIT_CODES.SUCCESS);
		}

		analytics.logEvent('Close rejected while flashing', {
			applicationSessionUuid,
			flashingWorkflowUuid,
		});
		popupExists = false;
	} catch (error: any) {
		exceptionReporter.report(error);
	}
});

export async function main() {
	try {
		const { init: ledsInit } = require('./models/leds');
		await ledsInit();
	} catch (error: any) {
		exceptionReporter.report(error);
	}

	ReactDOM.render(
		React.createElement(MainPage),
		document.getElementById('main'),
		// callback to set the correct zoomFactor for webviews as well
		async () => {
			const fullscreen = await settings.get('fullscreen');
			const width = fullscreen ? window.screen.width : window.outerWidth;
			try {
				electron.webFrame.setZoomFactor(width / settings.DEFAULT_WIDTH);
			} catch (err) {
				// noop
			}
		},
	);
}
