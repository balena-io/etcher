/**
 * This script is in charge of cleaning the `shrinkwrap` file.
 *
 * `npm shrinkwrap` has a bug where it will add optional dependencies
 * to `npm-shrinkwrap.json`, therefore causing errors if these optional
 * dependendencies are platform dependent and you then try to build
 * the project in another platform.
 *
 * As a workaround, we keep a list of platform dependent dependencies in
 * the `platformSpecificDependencies` property of `package.json`,
 * and manually remove them from `npm-shrinkwrap.json` if they exist.
 *
 * See: https://github.com/npm/npm/issues/2679
 */

import { writeFile } from 'fs';
import * as omit from 'omit-deep-lodash';
import * as path from 'path';
import { promisify } from 'util';

import * as shrinkwrap from '../npm-shrinkwrap.json';
import * as packageInfo from '../package.json';

const writeFileAsync = promisify(writeFile);

const JSON_INDENT = 2;
const SHRINKWRAP_FILENAME = path.join(__dirname, '..', 'npm-shrinkwrap.json');

async function main() {
	try {
		const cleaned = omit(shrinkwrap, packageInfo.platformSpecificDependencies);
		for (const item of Object.values(cleaned.dependencies)) {
			// @ts-ignore
			item.dev = true;
		}
		await writeFileAsync(
			SHRINKWRAP_FILENAME,
			JSON.stringify(cleaned, null, JSON_INDENT),
		);
	} catch (error: any) {
		console.log(`[ERROR] Couldn't write shrinkwrap file: ${error.stack}`);
		process.exitCode = 1;
	}
	console.log(
		`[OK] Wrote shrinkwrap file to ${path.relative(
			__dirname,
			SHRINKWRAP_FILENAME,
		)}`,
	);
}

main();
