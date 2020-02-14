/*
 * Copyright 2016 balena.io
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
import { promises as fs } from 'fs';
import * as os from 'os';
import { env } from 'process';
import { SinonStub, stub } from 'sinon';

import * as wnd from '../../../lib/gui/app/os/windows-network-drives';

describe('Network drives on Windows', () => {
	let osPlatformStub: SinonStub;
	let outputStub: SinonStub;
	let oldSystemRoot: string | undefined;

	before(async () => {
		osPlatformStub = stub(os, 'platform');
		osPlatformStub.returns('win32');
		const wmicOutput = await fs.readFile('tests/data/wmic-output.txt', {
			encoding: 'ucs2',
		});
		outputStub = stub(wnd, 'getWmicNetworkDrivesOutput');
		outputStub.resolves(wmicOutput);
		oldSystemRoot = env.SystemRoot;
		env.SystemRoot = 'C:\\Windows';
	});

	it('should parse network drive mapping on Windows', async () => {
		expect(
			await wnd.replaceWindowsNetworkDriveLetter('Z:\\some-folder\\some-file'),
		).to.equal('\\\\192.168.1.1\\Publicé\\some-folder\\some-file');
	});

	after(() => {
		osPlatformStub.restore();
		outputStub.restore();
		env.SystemRoot = oldSystemRoot;
	});
});
