import type { ForgeConfig } from '@electron-forge/shared-types';
import { MakerSquirrel } from '@electron-forge/maker-squirrel';
import { MakerZIP } from '@electron-forge/maker-zip';
import { MakerDeb } from '@electron-forge/maker-deb';
import { MakerRpm } from '@electron-forge/maker-rpm';
import { MakerDMG } from '@electron-forge/maker-dmg';
// import { MakerAppImage } from '@reforged/maker-appimage';
import { AutoUnpackNativesPlugin } from '@electron-forge/plugin-auto-unpack-natives';
import { WebpackPlugin } from '@electron-forge/plugin-webpack';
import { exec } from 'child_process';

import { mainConfig, rendererConfig } from './webpack.config';
import * as sidecar from './forge.sidecar';

import { hostDependencies, productDescription } from './package.json';

const isProduction = process.env.NODE_ENV === 'production';

const osxSigningConfig: any = {};
let winSigningConfig: any = {};

if (isProduction) {
	osxSigningConfig.osxNotarize = {
		tool: 'notarytool',
		appleId: process.env.XCODE_APP_LOADER_EMAIL,
		appleIdPassword: process.env.XCODE_APP_LOADER_PASSWORD,
		teamId: process.env.XCODE_APP_LOADER_TEAM_ID,
	};

	winSigningConfig = {
		signWithParams: `-sha1 ${process.env.SM_CODE_SIGNING_CERT_SHA1_HASH} -tr ${process.env.TIMESTAMP_SERVER} -td sha256 -fd sha256 -d balena-etcher`,
	};
}

// With signing credentials present (NODE_ENV=production) sign with the real
// Developer ID and notarize. Without them — local builds, and CI that has no
// certificate — fall back to an ad-hoc signature. macOS refuses to launch a
// repackaged arm64 bundle that carries no signature at all, and
// @electron/osx-sign throws "No identity found for signing" unless
// identityValidation is disabled. Hardened runtime is only meaningful
// alongside notarization, so it stays off for ad-hoc builds.
const osxSign: any = isProduction
	? {
			optionsForFile: () => ({
				entitlements: './entitlements.mac.plist',
				hardenedRuntime: true,
			}),
		}
	: {
			identity: '-',
			identityValidation: false,
			optionsForFile: () => ({
				entitlements: './entitlements.mac.plist',
				hardenedRuntime: false,
			}),
		};

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
		extraResource: [
			'lib/shared/sudo/sudo-askpass.osascript-zh.js',
			'lib/shared/sudo/sudo-askpass.osascript-en.js',
		],
		osxSign,
		...osxSigningConfig,
	},
	rebuildConfig: {
		onlyModules: [], // prevent rebuilding *any* native modules as they won't be used by electron but by the sidecar
	},
	makers: [
		new MakerZIP(),
		new MakerSquirrel({
			setupIcon: 'assets/icon.ico',
			loadingGif: 'assets/icon.png',
			...winSigningConfig,
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
		// new MakerAppImage({
		// 	options: {
		// 		icon: './assets/icon.png',
		// 		categories: ['Utility'],
		// 	},
		// }),
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
				depends: hostDependencies['debian'],
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
		new sidecar.SidecarPlugin(),
	],
	hooks: {
		postPackage: async (_forgeConfig, options) => {
			if (options.platform === 'linux') {
				// symlink the etcher binary from balena-etcher to balenaEtcher to ensure compatibility with the wdio suite and the old name
				await new Promise<void>((resolve, reject) => {
					exec(
						`ln -s "${options.outputPaths}/balena-etcher" "${options.outputPaths}/balenaEtcher"`,
						(err) => {
							if (err) {
								reject(err);
							} else {
								resolve();
							}
						},
					);
				});
			}
		},
	},
};

export default config;
