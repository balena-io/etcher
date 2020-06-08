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
import * as electronPath from 'electron';

describe('Spectron', function () {
	// Mainly for CI jobs
	this.timeout(40000);

	const app = new Application({
		path: (electronPath as unknown) as string,
		args: ['--no-sandbox', '.'],
	});

	before('app:start', async () => {
		await app.start();
	});

	after('app:stop', async () => {
		if (app && app.isRunning()) {
			await app.stop();
		}
	});

	describe('Browser Window', () => {
		it('should open a browser window', async () => {
			// We can't use `isVisible()` here as it won't work inside
			// a Windows Docker container, but we can approximate it
			// with these set of checks:
			const bounds = await app.browserWindow.getBounds();
			expect(bounds.height).to.be.above(0);
			expect(bounds.width).to.be.above(0);
			expect(await app.browserWindow.isMinimized()).to.be.false;
			expect(await app.browserWindow.isFocused()).to.be.true;
		});

		it('should set a proper title', async () => {
			// @ts-ignore (SpectronClient.getTitle exists)
			return expect(await app.client.getTitle()).to.equal('Etcher');
		});
	});
});
