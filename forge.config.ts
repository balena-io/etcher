import type { ForgeConfig } from '@electron-forge/shared-types';
import { MakerSquirrel } from '@electron-forge/maker-squirrel';
import { MakerZIP } from '@electron-forge/maker-zip';
import { MakerDeb } from '@electron-forge/maker-deb';
import { MakerRpm } from '@electron-forge/maker-rpm';
import { MakerDMG } from '@electron-forge/maker-dmg';
import { MakerAppImage } from '@reforged/maker-appimage';
import { AutoUnpackNativesPlugin } from '@electron-forge/plugin-auto-unpack-natives';
import { WebpackPlugin } from '@electron-forge/plugin-webpack';

import { mainConfig, rendererConfig } from './webpack.config';

import { productDescription } from './package.json';

const config: ForgeConfig = {
	packagerConfig: {
		asar: true,
		icon: './assets/icon',
		executableName:
			process.platform === 'linux' ? 'balena-etcher' : 'balenaEtcher',
		appBundleId: 'io.balena.etcher',
		appCategoryType: 'public.app-category.developer-tools',
		appCopyright: 'Copyright 2016-2023 Balena Ltd',
		darwinDarkModeSupport: true,
		protocols: [{ name: 'etcher', schemes: ['etcher'] }],

		// osxSign: {},
		// osxNotarize: {},

		extraResource: [
			'lib/shared/catalina-sudo/sudo-askpass.osascript-zh.js',
			'lib/shared/catalina-sudo/sudo-askpass.osascript-en.js',
		],
	},
	rebuildConfig: {},
	makers: [
		new MakerZIP(),
		new MakerSquirrel({
			setupIcon: 'assets/icon.ico',
		}),
		new MakerDMG({
			background: './assets/dmg/background.tiff',
			icon: './assets/icon.icns',
			iconSize: 110,
			contents: ((opts: { appPath: string }) => {
				return [
					{ x: 140, y: 250, type: 'file', path: opts.appPath },
					{ x: 415, y: 250, type: 'link', path: '/Applications' },
				];
			}) as any, // type of MakerDMGConfig omits `appPath`
			additionalDMGOptions: {
				window: {
					size: {
						width: 540,
						height: 425,
					},
					position: {
						x: 400,
						y: 500,
					},
				},
			},
		}),
		new MakerAppImage({
			options: {
				icon: './assets/icon.png',
				categories: ['Utility'],
			},
		}),
		new MakerRpm({
			options: {
				icon: './assets/icon.png',
				categories: ['Utility'],
				productDescription,
				requires: ['util-linux'],
			},
		}),
		new MakerDeb({
			options: {
				icon: './assets/icon.png',
				categories: ['Utility'],
				section: 'utils',
				priority: 'optional',
				productDescription,
				scripts: {
					postinst: './after-install.tpl',
				},
				depends: [
					'gconf-service',
					'gconf2',
					'libasound2',
					'libatk1.0-0',
					'libc6',
					'libcairo2',
					'libcups2',
					'libdbus-1-3',
					'libexpat1',
					'libfontconfig1',
					'libfreetype6',
					'libgbm1',
					'libgcc1',
					'libgconf-2-4',
					'libgdk-pixbuf2.0-0',
					'libglib2.0-0',
					'libgtk-3-0',
					'liblzma5',
					'libnotify4',
					'libnspr4',
					'libnss3',
					'libpango1.0-0 | libpango-1.0-0',
					'libstdc++6',
					'libx11-6',
					'libxcomposite1',
					'libxcursor1',
					'libxdamage1',
					'libxext6',
					'libxfixes3',
					'libxi6',
					'libxrandr2',
					'libxrender1',
					'libxss1',
					'libxtst6',
					'polkit-1-auth-agent | policykit-1-gnome | polkit-kde-1',
				],
			},
		}),
	],
	plugins: [
		new AutoUnpackNativesPlugin({}),
		new WebpackPlugin({
			mainConfig,
			renderer: {
				config: rendererConfig,
				nodeIntegration: true,
				entryPoints: [
					{
						html: './lib/gui/app/index.html',
						js: './lib/gui/app/renderer.ts',
						name: 'main_window',
						preload: {
							js: './lib/gui/app/preload.ts',
						},
					},
				],
			},
		}),
	],
};

export default config;
