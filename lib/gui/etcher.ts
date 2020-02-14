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

import { delay } from 'bluebird';
import * as electron from 'electron';
import { autoUpdater } from 'electron-updater';
import * as _ from 'lodash';
import * as path from 'path';
import * as semver from 'semver';

import { packageType, version } from '../../package.json';
import * as EXIT_CODES from '../shared/exit-codes';
import { getConfig } from '../shared/utils';
import * as settings from './app/models/settings';
import * as analytics from './app/modules/analytics';
import { buildWindowMenu } from './menu';

const configUrl =
	settings.get('configUrl') || 'https://balena.io/etcher/static/config.json';
const updatablePackageTypes = ['appimage', 'nsis', 'dmg'];
const packageUpdatable = _.includes(updatablePackageTypes, packageType);
let packageUpdated = false;

async function checkForUpdates(interval: number) {
	// We use a while loop instead of a setInterval to preserve
	// async execution time between each function call
	while (!packageUpdated) {
		if (settings.get('updatesEnabled')) {
			try {
				const release = await autoUpdater.checkForUpdates();
				const isOutdated =
					semver.compare(release.updateInfo.version, version) > 0;
				const shouldUpdate = release.updateInfo.stagingPercentage || 0 > 0;
				if (shouldUpdate && isOutdated) {
					await autoUpdater.downloadUpdate();
					packageUpdated = true;
				}
			} catch (err) {
				analytics.logException(err);
			}
		}
		await delay(interval);
	}
}

function createMainWindow() {
	const fullscreen = Boolean(settings.get('fullscreen'));
	const mainWindow = new electron.BrowserWindow({
		width: parseInt(settings.get('width'), 10) || 800,
		height: parseInt(settings.get('height'), 10) || 480,
		frame: !fullscreen,
		useContentSize: false,
		show: false,
		resizable: false,
		maximizable: false,
		fullscreen,
		fullscreenable: fullscreen,
		kiosk: fullscreen,
		autoHideMenuBar: true,
		titleBarStyle: 'hiddenInset',
		icon: path.join(__dirname, '..', '..', 'assets', 'icon.png'),
		darkTheme: true,
		webPreferences: {
			backgroundThrottling: false,
			nodeIntegration: true,
			webviewTag: true,
		},
	});

	buildWindowMenu(mainWindow);

	// Prevent flash of white when starting the application
	mainWindow.on('ready-to-show', () => {
		console.timeEnd('ready-to-show');
		mainWindow.show();
	});

	// Prevent external resources from being loaded (like images)
	// when dropping them on the WebView.
	// See https://github.com/electron/electron/issues/5919
	mainWindow.webContents.on('will-navigate', event => {
		event.preventDefault();
	});

	const dir = __dirname.split(path.sep).pop();

	if (dir === 'generated') {
		mainWindow.loadURL(
			`file://${path.join(__dirname, '..', 'lib', 'gui', 'app', 'index.html')}`,
		);
	} else {
		mainWindow.loadURL(`file://${path.join(__dirname, 'app', 'index.html')}`);
	}

	const page = mainWindow.webContents;

	page.once('did-frame-finish-load', async () => {
		autoUpdater.on('error', err => {
			analytics.logException(err);
		});
		if (packageUpdatable) {
			try {
				const onlineConfig = await getConfig(configUrl);
				const autoUpdaterConfig = _.get(
					onlineConfig,
					['autoUpdates', 'autoUpdaterConfig'],
					{
						autoDownload: false,
					},
				);
				_.merge(autoUpdater, autoUpdaterConfig);
				const checkForUpdatesTimer = _.get(
					onlineConfig,
					['autoUpdates', 'checkForUpdatesTimer'],
					300000,
				);
				checkForUpdates(checkForUpdatesTimer);
			} catch (err) {
				analytics.logException(err);
			}
		}
	});
}

electron.app.on('window-all-closed', electron.app.quit);

// Sending a `SIGINT` (e.g: Ctrl-C) to an Electron app that registers
// a `beforeunload` window event handler results in a disconnected white
// browser window in GNU/Linux and macOS.
// The `before-quit` Electron event is triggered in `SIGINT`, so we can
// make use of it to ensure the browser window is completely destroyed.
// See https://github.com/electron/electron/issues/5273
electron.app.on('before-quit', () => {
	process.exit(EXIT_CODES.SUCCESS);
});

async function main(): Promise<void> {
	try {
		await settings.load();
	} catch (error) {
		// TODO: What do if loading the config fails?
		console.error('Error loading settings:');
		console.error(error);
	} finally {
		if (electron.app.isReady()) {
			createMainWindow();
		} else {
			electron.app.on('ready', createMainWindow);
		}
	}
}

main();

console.time('ready-to-show');
