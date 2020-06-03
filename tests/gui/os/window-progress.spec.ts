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
import { assert, spy } from 'sinon';

import * as windowProgress from '../../../lib/gui/app/os/window-progress';

describe('Browser: WindowProgress', function () {
	describe('windowProgress', function () {
		describe('given a stubbed current window', function () {
			beforeEach(function () {
				this.setProgressBarSpy = spy();
				this.setTitleSpy = spy();

				windowProgress.currentWindow.setProgressBar = this.setProgressBarSpy;
				windowProgress.currentWindow.setTitle = this.setTitleSpy;

				this.state = {
					active: 1,
					type: 'flashing',
					failed: 0,
					percentage: 85,
					speed: 100,
				};
			});

			describe('.set()', function () {
				it('should translate 0-100 percentages to 0-1 ranges', function () {
					windowProgress.set(this.state);
					assert.calledWith(this.setProgressBarSpy, 0.85);
				});

				it('should set 0 given 0', function () {
					this.state.percentage = 0;
					windowProgress.set(this.state);
					assert.calledWith(this.setProgressBarSpy, 0);
				});

				it('should set 1 given 100', function () {
					this.state.percentage = 100;
					windowProgress.set(this.state);
					assert.calledWith(this.setProgressBarSpy, 1);
				});

				it('should throw if given a percentage higher than 100', function () {
					this.state.percentage = 101;
					const state = this.state;
					expect(function () {
						windowProgress.set(state);
					}).to.throw('Invalid percentage: 101');
				});

				it('should throw if given a percentage less than 0', function () {
					this.state.percentage = -1;
					const state = this.state;
					expect(function () {
						windowProgress.set(state);
					}).to.throw('Invalid percentage: -1');
				});

				it('should set the flashing title', function () {
					windowProgress.set(this.state);
					assert.calledWith(this.setTitleSpy, ' – 85% Flashing...');
				});

				it('should set the verifying title', function () {
					this.state.type = 'verifying';
					windowProgress.set(this.state);
					assert.calledWith(this.setTitleSpy, ' – 85% Validating...');
				});

				it('should set the starting title', function () {
					this.state.percentage = 0;
					this.state.speed = 0;
					windowProgress.set(this.state);
					assert.calledWith(this.setTitleSpy, ' – 0% Flashing...');
				});

				it('should set the finishing title', function () {
					this.state.percentage = 100;
					windowProgress.set(this.state);
					assert.calledWith(this.setTitleSpy, ' – Finishing...');
				});
			});

			describe('.clear()', function () {
				it('should set -1', function () {
					windowProgress.clear();
					assert.calledWith(this.setProgressBarSpy, -1);
				});

				it('should clear the window title', function () {
					windowProgress.clear();
					assert.calledWith(this.setTitleSpy, '');
				});
			});
		});
	});
});
