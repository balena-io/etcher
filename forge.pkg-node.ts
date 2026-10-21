/*
 * Build the sidecar on a Node.js release that yao-pkg/pkg-fetch has no
 * prebuilt base binary for yet. pkg-fetch can build a base binary from source,
 * but only for versions listed in its patches.json, so we register ours there
 * and reuse the patch set of the closest release pkg-fetch supports.
 *
 * Remove this once pkg-fetch ships a release including PKG_NODE_VERSION.
 */

import { execFileSync } from 'child_process';
import { createHash } from 'crypto';
import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';

import debug from 'debug';

const log = debug('sidecar:pkg-node');

// first v24 release blocking the compromised eMudhra intermediates (nodejs/node#66871)
const PKG_NODE_VERSION = 'v24.22.1';
// pkg-fetch patch set applied to PKG_NODE_VERSION
const PKG_NODE_PATCHES_FROM = 'v24.20.0';
// from https://nodejs.org/dist/v24.22.1/SHASUMS256.txt.asc (GPG verified against nodejs/release-keys)
const PKG_NODE_TARBALL_SHA256 =
	'001773d9bd53fbd27a25efd42aa6a9693ebfe500998ca9bec635e9b6ee79bc91';
// pkg-fetch configures Node.js `--without-inspector`, so this file isn't compiled
const ALLOWED_PATCH_FAILURES = ['src/inspector_agent.cc'];

const TARBALL_NAME = `node-${PKG_NODE_VERSION}.tar.gz`;

function pkgFetchDir(): string {
	const pkgDir = path.dirname(require.resolve('@yao-pkg/pkg/package.json'));
	return path.dirname(
		require.resolve('@yao-pkg/pkg-fetch/package.json', { paths: [pkgDir] }),
	);
}

function sha256(file: string): string {
	return createHash('sha256').update(fs.readFileSync(file)).digest('hex');
}

// make pkg-fetch resolve `node24` to PKG_NODE_VERSION; returns its patch files
function registerNodeVersion(fetchDir: string): string[] {
	const patchesJson = path.join(fetchDir, 'patches', 'patches.json');
	const patches = JSON.parse(fs.readFileSync(patchesJson, 'utf8'));
	const patchFiles = patches[PKG_NODE_PATCHES_FROM];
	if (!Array.isArray(patchFiles)) {
		throw new Error(
			`pkg-fetch has no patches for ${PKG_NODE_PATCHES_FROM}, update forge.pkg-node.ts`,
		);
	}
	if (patches[PKG_NODE_VERSION] === undefined) {
		log(`registering ${PKG_NODE_VERSION} in ${patchesJson}`);
		patches[PKG_NODE_VERSION] = { sameAs: PKG_NODE_PATCHES_FROM };
		fs.writeFileSync(patchesJson, JSON.stringify(patches, null, 2) + '\n');
	}
	return patchFiles;
}

// pkg-fetch only downloads SHASUMS256.txt (unsigned) when the tarball or its
// .sha256sum are missing from the cache, and checks the tarball against that
// file before building: provide both so it checks against our pinned hash
async function provideTarball(cacheDir: string): Promise<string> {
	const nodeDir = path.join(cacheDir, 'node');
	const tarball = path.join(nodeDir, TARBALL_NAME);
	if (!fs.existsSync(tarball) || sha256(tarball) !== PKG_NODE_TARBALL_SHA256) {
		const url = `https://nodejs.org/dist/${PKG_NODE_VERSION}/${TARBALL_NAME}`;
		log(`downloading ${url}`);
		const response = await fetch(url);
		if (!response.ok) {
			throw new Error(`Failed to download ${url}: ${response.status}`);
		}
		fs.mkdirSync(nodeDir, { recursive: true });
		fs.writeFileSync(
			`${tarball}.download`,
			Buffer.from(await response.arrayBuffer()),
		);
		const actual = sha256(`${tarball}.download`);
		if (actual !== PKG_NODE_TARBALL_SHA256) {
			fs.rmSync(`${tarball}.download`);
			throw new Error(
				`Hash mismatch for ${TARBALL_NAME}: expected ${PKG_NODE_TARBALL_SHA256}, got ${actual}`,
			);
		}
		fs.renameSync(`${tarball}.download`, tarball);
	}
	fs.writeFileSync(
		`${tarball}.sha256sum`,
		`${PKG_NODE_TARBALL_SHA256}  ${TARBALL_NAME}`,
	);
	return tarball;
}

// pkg-fetch ignores `patch` failures and builds anyway: dry-run the patches
// against the files they touch and fail on any rejected hunk we don't expect
function checkPatches(fetchDir: string, patchFiles: string[], tarball: string) {
	const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'pkg-node-'));
	try {
		for (const patchFile of patchFiles) {
			const patchPath = path.join(fetchDir, 'patches', patchFile);
			// existing files touched by the patch, new files have a `--- /dev/null` header
			const touched = [
				...fs.readFileSync(patchPath, 'utf8').matchAll(/^--- node\/(\S+)$/gm),
			].map(([, file]) => file);
			// relative archive path: GNU tar reads `C:\...` as a remote `host:path`
			execFileSync(
				'tar',
				[
					'-xzf',
					TARBALL_NAME,
					'-C',
					tmpDir,
					'--strip-components=1',
					...touched.map((file) => `node-${PKG_NODE_VERSION}/${file}`),
				],
				{ cwd: path.dirname(tarball) },
			);

			let output: string;
			try {
				output = execFileSync(
					'patch',
					['--dry-run', '--batch', '-p1', '-d', tmpDir, '-i', patchPath],
					{ encoding: 'utf8' },
				);
			} catch (error: any) {
				output = `${error.stdout ?? ''}${error.stderr ?? ''}`;
			}

			// `patching file X` is followed by the failures for X, if any
			let current = '';
			const failed = new Set<string>();
			for (const line of output.split('\n')) {
				const patching = line.match(/^patching file '?([^']+?)'?$/);
				if (patching) {
					current = patching[1];
				} else if (/FAILED|failed|can't find file/.test(line)) {
					failed.add(current);
				}
			}
			const unexpected = [...failed].filter(
				(file) => !ALLOWED_PATCH_FAILURES.includes(file),
			);
			if (unexpected.length > 0) {
				throw new Error(
					`pkg-fetch patch ${patchFile} doesn't apply to ${PKG_NODE_VERSION}: ${unexpected.join(', ')}\n${output}`,
				);
			}
			log(`${patchFile} applies to ${PKG_NODE_VERSION}`, { failed });
		}
	} finally {
		fs.rmSync(tmpDir, { recursive: true, force: true });
	}
}

export async function preparePkgNode(arch: string) {
	const fetchDir = pkgFetchDir();
	const patchFiles = registerNodeVersion(fetchDir);

	// pkg-fetch reads patches.json when loaded, so only load it now
	const { need, system } = require(fetchDir);
	const status = await need({
		nodeRange: 'node24',
		platform: system.hostPlatform,
		arch,
		dryRun: true,
	});
	log(`pkg-fetch base binary for node24-${arch}: ${status}`);
	if (status === 'exists') {
		return;
	}

	const cacheDir =
		process.env.PKG_CACHE_PATH || path.join(os.homedir(), '.pkg-cache');
	const tarball = await provideTarball(cacheDir);
	checkPatches(fetchDir, patchFiles, tarball);
	console.log(
		`Building Node.js ${PKG_NODE_VERSION} for pkg from source, this takes a while...`,
	);
}
