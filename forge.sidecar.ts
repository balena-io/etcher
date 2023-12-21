import { PluginBase } from '@electron-forge/plugin-base';
import {
	ForgeHookMap,
	ResolvedForgeConfig,
} from '@electron-forge/shared-types';
import { WebpackPlugin } from '@electron-forge/plugin-webpack';
import { DefinePlugin } from 'webpack';

import { execFileSync } from 'child_process';
import * as fs from 'fs';
import * as path from 'path';

import * as d from 'debug';

const debug = d('sidecar');

function isStartScrpt(): boolean {
	return process.env.npm_lifecycle_event === 'start';
}

function addWebpackDefine(
	config: ResolvedForgeConfig,
	defineName: string,
	binDir: string,
	binName: string,
): ResolvedForgeConfig {
	config.plugins.forEach((plugin) => {
		if (plugin.name !== 'webpack' || !(plugin instanceof WebpackPlugin)) {
			return;
		}

		const { mainConfig } = plugin.config as any;
		if (mainConfig.plugins == null) {
			mainConfig.plugins = [];
		}

		const value = isStartScrpt()
			? // on `npm start`, point directly to the binary
			  path.resolve(binDir, binName)
			: // otherwise point relative to the resources folder of the bundled app
			  binName;

		debug(`define '${defineName}'='${value}'`);

		mainConfig.plugins.push(
			new DefinePlugin({
				// expose path to helper via this webpack define
				[defineName]: JSON.stringify(value),
			}),
		);
	});

	return config;
}

function build(
	sourcesDir: string,
	buildForArchs: string,
	binDir: string,
	binName: string,
) {
	const commands: Array<[string, string[], object?]> = [
		['tsc', ['--project', 'tsconfig.sidecar.json', '--outDir', sourcesDir]],
	];

	buildForArchs.split(',').forEach((arch) => {
		const binPath = isStartScrpt()
			? // on `npm start`, we don't know the arch we're building for at the time we're
			  // adding the webpack define, so we just build under binDir
			  path.resolve(binDir, binName)
			: // otherwise build in arch-specific directory within binDir
			  path.resolve(binDir, arch, binName);

		// FIXME: rebuilding mountutils shouldn't be necessary, but it is.
		// It's coming from etcher-sdk, a fix has been upstreamed but to use
		// the latest etcher-sdk we need to upgrade axios at the same time.
		commands.push(['npm', ['rebuild', 'mountutils', `--arch=${arch}`]]);

		commands.push([
			'pkg',
			[
				path.join(sourcesDir, 'util', 'api.js'),
				'-c',
				'pkg-sidecar.json',
				// `--no-bytecode` so that we can cross-compile for arm64 on x64
				'--no-bytecode',
				'--public',
				'--public-packages',
				'"*"',
				// always build for host platform and node version
				// https://github.com/vercel/pkg-fetch/releases
				'--target',
				`node18-${arch}`,
				'--output',
				binPath,
			],
		]);
	});

	commands.forEach(([cmd, args, opt]) => {
		debug('running command:', cmd, args.join(' '));
		execFileSync(cmd, args, { shell: true, stdio: 'inherit', ...opt });
	});
}

function copyArtifact(
	buildPath: string,
	arch: string,
	binDir: string,
	binName: string,
) {
	const binPath = isStartScrpt()
		? // on `npm start`, we don't know the arch we're building for at the time we're
		  // adding the webpack define, so look for the binary directly under binDir
		  path.resolve(binDir, binName)
		: // otherwise look into arch-specific directory within binDir
		  path.resolve(binDir, arch, binName);

	// buildPath points to appPath, which is inside resources dir which is the one we actually want
	const resourcesPath = path.dirname(buildPath);
	const dest = path.resolve(resourcesPath, path.basename(binPath));
	debug(`copying '${binPath}' to '${dest}'`);
	fs.copyFileSync(binPath, dest);
}

export class SidecarPlugin extends PluginBase<void> {
	name = 'sidecar';

	constructor() {
		super();
		this.getHooks = this.getHooks.bind(this);
		debug('isStartScript:', isStartScrpt());
	}

	getHooks(): ForgeHookMap {
		const DEFINE_NAME = 'ETCHER_UTIL_BIN_PATH';
		const BASE_DIR = path.join('out', 'sidecar');
		const SRC_DIR = path.join(BASE_DIR, 'src');
		const BIN_DIR = path.join(BASE_DIR, 'bin');
		const BIN_NAME = `etcher-util${process.platform === 'win32' ? '.exe' : ''}`;

		return {
			resolveForgeConfig: async (currentConfig) => {
				debug('resolveForgeConfig');
				return addWebpackDefine(currentConfig, DEFINE_NAME, BIN_DIR, BIN_NAME);
			},
			generateAssets: async (_config, platform, arch) => {
				debug('generateAssets', { platform, arch });
				build(SRC_DIR, arch, BIN_DIR, BIN_NAME);
			},
			packageAfterCopy: async (
				_config,
				buildPath,
				electronVersion,
				platform,
				arch,
			) => {
				debug('packageAfterCopy', {
					buildPath,
					electronVersion,
					platform,
					arch,
				});
				copyArtifact(buildPath, arch, BIN_DIR, BIN_NAME);
			},
		};
	}
}
