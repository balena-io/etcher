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

import { expect } from 'chai';
import { Application } from 'spectron';

import * as EXIT_CODES from '../../lib/shared/exit-codes';

const entrypoint = process.env.ETCHER_SPECTRON_ENTRYPOINT;

if (!entrypoint) {
	console.error('You need to properly configure ETCHER_SPECTRON_ENTRYPOINT');
	process.exit(EXIT_CODES.GENERAL_ERROR);
}

describe('Spectron', function () {
	// Mainly for CI jobs
	this.timeout(40000);

	let app: Application;

	before('app:start', function () {
		app = new Application({
			path: entrypoint,
			args: ['--no-sandbox', '.'],
		});

		return app.start();
	});

	after('app:stop', function () {
		if (app && app.isRunning()) {
			return app.stop();
		}

		return Promise.resolve();
	});

	describe('Browser Window', function () {
		it('should open a browser window', async function () {
			return expect(await app.browserWindow.isVisible()).to.be.true;
		});

		it('should set a proper title', async function () {
			// @ts-ignore (SpectronClient.getTitle exists)
			return expect(await app.client.getTitle()).to.equal('Etcher');
		});
	});
});
