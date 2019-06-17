/*
 * Copyright 2019 balena.io
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

import * as _ from 'lodash';

const ledLibrary: any = {
	setBrightness(pin: number, brightness: number) {
		console.log(`Set brightness of led ${pin} to RGB: ${brightness}`);
	},
	setColor(pin: number, r: number, g: number, b: number) {
		console.log(`Set color of led ${pin} to RGB: ${r}${g}${b}`);
	},
	blink(
		pin: number,
		color: Array<[number, number, number]>,
		brightness: number,
		interval: number,
	) {
		setInterval(() => {
			console.log(
				`Blinking led ${pin} with color ${color} on brightness ${brightness} and interval ${1 /
					interval}`,
			);
		}, (1 / interval) * 1000);
	},
};

export class LedRGB {
	public r: number = 0;
	public g: number = 1;
	public b: number = 0;
}

export class Led {
	public pin: number;
	public targetPath: string;
	public on: boolean = false;
	public brightness: number = 100;
	public color: LedRGB;

	constructor(targetPath: string, pin: number) {
		this.targetPath = targetPath;
		this.pin = pin;
	}

	setBrightness(brightness: number) {
		this.brightness = brightness;
		ledLibrary.setBrightness(this.pin, brightness);
	}

	setColor({ r, g, b }: LedRGB) {
		this.color = { r, g, b };
		ledLibrary.setColor(this.pin, r, g, b);
	}

	blink({ r, g, b }: LedRGB, interval: number) {
		this.color = { r, g, b };
		ledLibrary.blink(this.pin, r, g, b, interval);
	}
}

const ledTargetMap = _.map(
	[
		['IODeviceTree:/PCI0@0/XHC1@14', 13],
		['IODeviceTree:/PCI0@0/PEG2@1,2/UPSB@0/DSB2@2/XHC3@0', 16],
	],
	([targetPath, pin]: [string, number]) => new Led(targetPath, pin),
);

console.log('ledTargetMap', ledTargetMap);
