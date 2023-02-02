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
import * as remoteMain from '@electron/remote/main';
import { autoUpdater } from 'electron-updater';
import { promises as fs } from 'fs';
import { platform } from 'os';
import * as path from 'path';
import * as semver from 'semver';
import * as _ from 'lodash';

import './app/i18n';

import { packageType, version } from '../../package.json';
import * as EXIT_CODES from '../shared/exit-codes';
import * as settings from './app/models/settings';
import { buildWindowMenu } from './menu';
import * as i18n from 'i18next';
import * as SentryMain from '@sentry/electron/main';
import * as packageJSON from '../../package.json';
import { anonymizeSentryData } from './app/modules/analytics';

const customProtocol = 'etcher';
const scheme = `${customProtocol}://`;
const updatablePackageTypes = ['appimage', 'nsis', 'dmg'];
const packageUpdatable = updatablePackageTypes.includes(packageType);
let packageUpdated = false;
let mainWindow: any = null;

remoteMain.initialize();

async function checkForUpdates(interval: number) {
	// We use a while loop instead of a setInterval to preserve
	// async execution time between each function call
	while (!packageUpdated) {
		if (await settings.get('updatesEnabled')) {
			try {
				const release = await autoUpdater.checkForUpdates();
				const isOutdated =
					semver.compare(release!.updateInfo.version, version) > 0;
				const shouldUpdate = release!.updateInfo.stagingPercentage !== 0; // undefinded (default) means 100%
				if (shouldUpdate && isOutdated) {
					await autoUpdater.downloadUpdate();
					packageUpdated = true;
				}
			} catch (err) {
				logMainProcessException(err);
			}
		}
		await delay(interval);
	}
}

function logMainProcessException(error: any) {
	const shouldReportErrors = settings.getSync('errorReporting');
	console.error(error);
	if (shouldReportErrors) {
		SentryMain.captureException(error);
	}
}

async function isFile(filePath: string): Promise<boolean> {
	try {
		const stat = await fs.stat(filePath);
		return stat.isFile();
	} catch {
		// noop
	}
	return false;
}

async function getCommandLineURL(argv: string[]): Promise<string | undefined> {
	argv = argv.slice(electron.app.isPackaged ? 1 : 2);
	if (argv.length) {
		const value = argv[argv.length - 1];
		// Take into account electron arguments
		if (value.startsWith('--')) {
			return;
		}
		// https://stackoverflow.com/questions/10242115/os-x-strange-psn-command-line-parameter-when-launched-from-finder
		if (platform() === 'darwin' && value.startsWith('-psn_')) {
			return;
		}
		if (
			!value.startsWith('http://') &&
			!value.startsWith('https://') &&
			!value.startsWith(scheme) &&
			!(await isFile(value))
		) {
			return;
		}
		return value;
	}
}

const initSentryMain = _.once(() => {
	const dsn =
		settings.getSync('analyticsSentryToken') ||
		_.get(packageJSON, ['analytics', 'sentry', 'token']);

	SentryMain.init({ dsn, beforeSend: anonymizeSentryData });
});

const sourceSelectorReady = new Promise((resolve) => {
	electron.ipcMain.on('source-selector-ready', resolve);
});

async function selectImageURL(url?: string) {
	// 'data:,' is the default chromedriver url that is passed as last argument when running spectron tests
	if (url !== undefined && url !== 'data:,') {
		url = url.replace(/\/$/, ''); // on windows the url ends with an extra slash
		url = url.startsWith(scheme) ? url.slice(scheme.length) : url;
		await sourceSelectorReady;
		electron.BrowserWindow.getAllWindows().forEach((window) => {
			window.webContents.send('select-image', url);
		});
	}
}

// This will catch clicks on links such as <a href="etcher://...">Open in Etcher</a>
// We need to listen to the event before everything else otherwise the event won't be fired
electron.app.on('open-url', async (event, data) => {
	event.preventDefault();
	await selectImageURL(data);
});

interface AutoUpdaterConfig {
	autoDownload?: boolean;
	autoInstallOnAppQuit?: boolean;
	allowPrerelease?: boolean;
	fullChangelog?: boolean;
	allowDowngrade?: boolean;
}

async function createMainWindow() {
	const fullscreen = Boolean(await settings.get('fullscreen'));
	const defaultWidth = settings.DEFAULT_WIDTH;
	const defaultHeight = settings.DEFAULT_HEIGHT;
	let width = defaultWidth;
	let height = defaultHeight;
	if (fullscreen) {
		({ width, height } = electron.screen.getPrimaryDisplay().bounds);
	}
	mainWindow = new electron.BrowserWindow({
		width,
		height,
		frame: !fullscreen,
		useContentSize: true,
		show: false,
		resizable: false,
		maximizable: false,
		fullscreen,
		fullscreenable: fullscreen,
		kiosk: fullscreen,
		autoHideMenuBar: true,
		titleBarStyle: 'hiddenInset',
		icon: path.join(__dirname, 'media', 'icon.png'),
		darkTheme: true,
		webPreferences: {
			backgroundThrottling: false,
			nodeIntegration: true,
			contextIsolation: false,
			webviewTag: true,
			zoomFactor: width / defaultWidth,
			enableRemoteModule: true,
		},
	});

	electron.app.setAsDefaultProtocolClient(customProtocol);

	mainWindow.setFullScreen(true);

	// Prevent flash of white when starting the application
	mainWindow.on('ready-to-show', () => {
		console.timeEnd('ready-to-show');
		// Electron sometimes caches the zoomFactor
		// making it obnoxious to switch back-and-forth
		mainWindow.webContents.setZoomFactor(width / defaultWidth);
		mainWindow.show();
	});

	// Prevent external resources from being loaded (like images)
	// when dropping them on the WebView.
	// See https://github.com/electron/electron/issues/5919
	mainWindow.webContents.on('will-navigate', (event) => {
		event.preventDefault();
	});

	mainWindow.loadURL(
		`file://${path.join(
			'/',
			...__dirname.split(path.sep).map(encodeURIComponent),
			'index.html',
		)}`,
	);

	return mainWindow;
}

electron.app.allowRendererProcessReuse = false;
electron.app.on('window-all-closed', electron.app.quit);

// Sending a `SIGINT` (e.g: Ctrl-C) to an Electron app that registers
// a `beforeunload` window event handler results in a disconnected white
// browser window in GNU/Linux and macOS.
// The `before-quit` Electron event is triggered in `SIGINT`, so we can
// make use of it to ensure the browser window is completely destroyed.
// See https://github.com/electron/electron/issues/5273
electron.app.on('before-quit', () => {
	electron.app.releaseSingleInstanceLock();
	process.exit(EXIT_CODES.SUCCESS);
});

async function main(): Promise<void> {
	if (!electron.app.requestSingleInstanceLock()) {
		electron.app.quit();
	} else {
		initSentryMain();
		await electron.app.whenReady();
		const window = await createMainWindow();
		electron.app.on('second-instance', async (_event, argv) => {
			if (window.isMinimized()) {
				window.restore();
			}
			window.focus();
			await selectImageURL(await getCommandLineURL(argv));
		});
		await selectImageURL(await getCommandLineURL(process.argv));

		electron.ipcMain.on('change-lng', function (event, args) {
			i18n.changeLanguage(args, () => {
				console.log('Language changed to: ' + args);
			});
			if (mainWindow != null) {
				buildWindowMenu(mainWindow);
			} else {
				console.log('Build menu failed. ');
			}
		});
	}
}
main();

console.time('ready-to-show');
