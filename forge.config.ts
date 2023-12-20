import type { ForgeConfig } from '@electron-forge/shared-types';
import { MakerSquirrel } from '@electron-forge/maker-squirrel';
import { MakerZIP } from '@electron-forge/maker-zip';
import { MakerDeb } from '@electron-forge/maker-deb';
import { MakerRpm } from '@electron-forge/maker-rpm';
import { AutoUnpackNativesPlugin } from '@electron-forge/plugin-auto-unpack-natives';
import { WebpackPlugin } from '@electron-forge/plugin-webpack';

import { mainConfig, rendererConfig } from './webpack.config';

const config: ForgeConfig = {
	packagerConfig: {
		asar: true,
		icon: './assets/icon',
		extraResource: [
			'lib/shared/catalina-sudo/sudo-askpass.osascript-zh.js',
			'lib/shared/catalina-sudo/sudo-askpass.osascript-en.js',
		],
	},
	rebuildConfig: {},
	makers: [
		new MakerSquirrel({}),
		new MakerZIP({}, ['darwin']),
		new MakerRpm({}),
		new MakerDeb({}),
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
