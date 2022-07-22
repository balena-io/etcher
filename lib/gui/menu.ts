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

import * as electron from 'electron';
import { displayName } from '../../package.json';

import * as i18next from 'i18next';

/**
 * @summary Builds a native application menu for a given window
 */
export function buildWindowMenu(window: electron.BrowserWindow) {
	/**
	 * @summary Toggle the main window's devtools
	 */
	function toggleDevTools() {
		if (!window) {
			return;
		}
		// NOTE: We can't use `webContents.toggleDevTools()` here,
		// as we need to force detached mode
		if (window.webContents.isDevToolsOpened()) {
			window.webContents.closeDevTools();
		} else {
			window.webContents.openDevTools({
				mode: 'detach',
			});
		}
	}

	const menuTemplate: electron.MenuItemConstructorOptions[] = [
		{
			role: 'editMenu',
			label: i18next.t('menu.edit'),
		},
		{
			label: i18next.t('menu.view'),
			submenu: [
				{
					label: i18next.t('menu.devTool'),
					accelerator:
						process.platform === 'darwin' ? 'Command+Alt+I' : 'Control+Shift+I',
					click: toggleDevTools,
				},
			],
		},
		{
			role: 'windowMenu',
			label: i18next.t('menu.window'),
		},
		{
			role: 'help',
			label: i18next.t('menu.help'),
			submenu: [
				{
					label: i18next.t('menu.pro'),
					click() {
						electron.shell.openExternal(
							'https://etcher.io/pro?utm_source=etcher_menu&ref=etcher_menu',
						);
					},
				},
				{
					label: i18next.t('menu.website'),
					click() {
						electron.shell.openExternal('https://etcher.io?ref=etcher_menu');
					},
				},
				{
					label: i18next.t('menu.issue'),
					click() {
						electron.shell.openExternal(
							'https://github.com/balena-io/etcher/issues',
						);
					},
				},
			],
		},
	];

	if (process.platform === 'darwin') {
		menuTemplate.unshift({
			label: displayName,
			submenu: [
				{
					role: 'about' as const,
					label: i18next.t('menu.about'),
				},
				{
					type: 'separator' as const,
				},
				{
					role: 'hide' as const,
					label: i18next.t('menu.hide'),
				},
				{
					role: 'hideOthers' as const,
					label: i18next.t('menu.hideOthers'),
				},
				{
					role: 'unhide' as const,
					label: i18next.t('menu.unhide'),
				},
				{
					type: 'separator' as const,
				},
				{
					role: 'quit' as const,
					label: i18next.t('menu.quit'),
				},
			],
		});
	} else {
		menuTemplate.unshift({
			label: displayName,
			submenu: [
				{
					role: 'quit',
				},
			],
		});
	}

	const menu = electron.Menu.buildFromTemplate(menuTemplate);

	electron.Menu.setApplicationMenu(menu);
}
