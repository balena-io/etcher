'use strict';

// Installs the Windows-only native dependency that `npm install` skips.
//
// winusb-driver-generator caps its `engines` field at "<23", so npm silently
// skips it on Node 24 even though the addon is N-API and builds and loads
// there perfectly well. Nothing overrides that: --force,
// --engine-strict=false and --include=optional all still skip it, and asking
// for it by name does not help either, because npm still classifies it as
// the optional dependency this package.json declares.
//
// So build it in a throwaway directory, where it is an ordinary dependency
// and npm installs it with nothing more than an EBADENGINE warning, then copy
// the result into place. Staging it this way also keeps `npm install` away
// from the real tree: it reconciles every package when it runs, and doing
// that against a tree another process is using leaves node_modules
// half-pruned.
//
// Only `bindings` is needed at runtime, and that is already hoisted into
// node_modules by mountutils; node-addon-api is a build-time dependency.

const { execFileSync } = require('node:child_process');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');

const PACKAGE = 'winusb-driver-generator';
const root = path.join(__dirname, '..');

if (process.platform !== 'win32') {
	console.log(`Not Windows — ${PACKAGE} is not needed.`);
	process.exit(0);
}

const { optionalDependencies } = require(path.join(root, 'package.json'));
const version = optionalDependencies[PACKAGE];
if (!version) {
	console.error(`${PACKAGE} is not listed in optionalDependencies.`);
	process.exit(1);
}

const destination = path.join(root, 'node_modules', PACKAGE);
const binding = path.join(destination, 'build', 'Release', 'Generator.node');

if (fs.existsSync(binding)) {
	console.log(`${PACKAGE}@${version} is already built.`);
	process.exit(0);
}

const staging = fs.mkdtempSync(path.join(os.tmpdir(), 'etcher-winusb-'));
try {
	fs.writeFileSync(
		path.join(staging, 'package.json'),
		`${JSON.stringify(
			{
				name: 'winusb-staging',
				version: '1.0.0',
				private: true,
				dependencies: { [PACKAGE]: version },
				// npm 11 blocks install scripts that are not explicitly approved,
				// and this package is built from source by node-gyp.
				allowScripts: { [`${PACKAGE}@${version}`]: true },
			},
			null,
			2,
		)}\n`,
	);

	console.log(`Building ${PACKAGE}@${version} in ${staging}...`);
	execFileSync('npm', ['install', '--no-audit', '--no-fund'], {
		cwd: staging,
		stdio: 'inherit',
		shell: true,
	});

	const built = path.join(staging, 'node_modules', PACKAGE);
	if (!fs.existsSync(path.join(built, 'build', 'Release', 'Generator.node'))) {
		throw new Error(
			`${PACKAGE} installed but produced no binding. It is compiled from ` +
				'source, so this is usually a toolchain problem: Visual Studio with ' +
				'the C++ workload is required, and NoDefaultCurrentDirectoryInExePath ' +
				'must not be set — its embed.bat runs embedder.exe from the working ' +
				'directory.',
		);
	}

	fs.rmSync(destination, { recursive: true, force: true });
	fs.mkdirSync(path.dirname(destination), { recursive: true });
	fs.cpSync(built, destination, { recursive: true });
} finally {
	fs.rmSync(staging, { recursive: true, force: true });
}

if (!fs.existsSync(binding)) {
	console.error(`Failed to place ${PACKAGE} into node_modules.`);
	process.exit(1);
}

console.log(`${PACKAGE}@${version} built and installed.`);
