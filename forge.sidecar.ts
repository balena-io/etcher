import { PluginBase } from '@electron-forge/plugin-base';
import type {
	ForgeMultiHookMap,
	ResolvedForgeConfig,
} from '@electron-forge/shared-types';
import { WebpackPlugin } from '@electron-forge/plugin-webpack';
import { DefinePlugin } from 'webpack';

import { execFileSync } from 'child_process';
import * as fs from 'fs';
import * as path from 'path';

import debug from 'debug';

const log = debug('sidecar');

// winusb-driver-generator caps `engines` at "<23", so npm silently skips it
// as an optional dependency on Node 24 — even though the addon is N-API and
// builds and loads there perfectly well. No npm flag overrides that for
// optional dependencies (--force, --engine-strict=false and
// --include=optional were all tried), so `npm run install-win-deps` asks for
// it by name. Without it the sidecar dies with MODULE_NOT_FOUND as soon as
// drive scanning starts, because etcher-sdk's DriverlessDeviceAdapter
// requires it eagerly.
//
// It is built by node-gyp from source — there are no published prebuilds for
// this package — so the binding's presence is the only reliable signal that
// it is actually usable.
function hasWinusbBinding(): boolean {
	return fs.existsSync(
		path.resolve(
			'node_modules',
			'winusb-driver-generator',
			'build',
			'Release',
			'Generator.node',
		),
	);
}

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

		log(`define '${defineName}'='${value}'`);

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
		//
		// mountutils is the only NAN (non-N-API) addon we bundle, so it is
		// also the only one whose ABI has to match the runtime pkg embeds
		// below. Rebuilding it here against the Node running the build is
		// what keeps the two in step; see the `engines` field.
		commands.push(['npm', ['rebuild', 'mountutils', `--arch=${arch}`]]);

		// winusb-driver-generator has to be present before we get here; see
		// the note on hasWinusbBinding(). Fail loudly rather than letting
		// pkg bundle a sidecar that dies on its first drive scan.
		if (process.platform === 'win32' && !hasWinusbBinding()) {
			throw new Error(
				'winusb-driver-generator is not built. Run `npm run install-win-deps` ' +
					'before packaging on Windows; npm skips it during install because ' +
					'its `engines` field predates the Node version in use.',
			);
		}

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
				// Pin to a specific Node build. The bare `nodeXX` targets
				// resolve to whatever pkg-fetch knew about at publish time,
				// which can ship runtimes that segfault on newer host OSes
				// (e.g. v20.11.1 — and even v20.20.2 — crash on macOS 26).
				//
				// This must stay on the same major as the Node that builds
				// the project, because `mountutils` above is rebuilt against
				// the build's Node and NAN addons are ABI-locked per major
				// (Node 22 = ABI 127, Node 24 = ABI 137). Patch releases
				// share an ABI, so any 24.x host is fine here.
				//
				// v24.18.1 is the Node 24 build @yao-pkg/pkg-fetch 3.6.5
				// knows about; see its patches/patches.json for the list.
				// https://github.com/yao-pkg/pkg-fetch/releases
				'--target',
				`node24.18.1-${arch}`,
				'--output',
				binPath,
			],
		]);
	});

	commands.forEach(([cmd, args, opt]) => {
		log('running command:', cmd, args.join(' '));
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
	log(`copying '${binPath}' to '${dest}'`);
	fs.copyFileSync(binPath, dest);
}

export class SidecarPlugin extends PluginBase<void> {
	name = 'sidecar';

	constructor() {
		super();
		this.getHooks = this.getHooks.bind(this);
		log('isStartScript:', isStartScrpt());
	}

	getHooks(): ForgeMultiHookMap {
		const DEFINE_NAME = 'ETCHER_UTIL_BIN_PATH';
		const BASE_DIR = path.join('out', 'sidecar');
		const SRC_DIR = path.join(BASE_DIR, 'src');
		const BIN_DIR = path.join(BASE_DIR, 'bin');
		const BIN_NAME = `etcher-util${process.platform === 'win32' ? '.exe' : ''}`;

		return {
			resolveForgeConfig: async (currentConfig) => {
				log('resolveForgeConfig');
				return addWebpackDefine(currentConfig, DEFINE_NAME, BIN_DIR, BIN_NAME);
			},
			generateAssets: async (_config, platform, arch) => {
				log('generateAssets', { platform, arch });
				build(SRC_DIR, arch, BIN_DIR, BIN_NAME);
			},
			packageAfterCopy: async (
				_config,
				buildPath,
				electronVersion,
				platform,
				arch,
			) => {
				log('packageAfterCopy', {
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
