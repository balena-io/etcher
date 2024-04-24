/*
 * Copyright 2022 balena.io
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

import type { Dictionary } from 'lodash';

type BalenaTag = {
	id: number;
	name: string;
	value: string;
};

export class EtcherPro {
	private supervisorAddr: string;
	private supervisorKey: string;
	private tags: Dictionary<string> | undefined;
	public uuid: string;

	constructor(supervisorAddr: string, supervisorKey: string) {
		this.supervisorAddr = supervisorAddr;
		this.supervisorKey = supervisorKey;
		this.uuid = (process.env.BALENA_DEVICE_UUID ?? 'NO-UUID').substring(0, 7);
		this.tags = undefined;
		this.get_tags().then((tags) => (this.tags = tags));
	}

	async get_tags(): Promise<Dictionary<string>> {
		const result = await fetch(
			this.supervisorAddr + '/v2/device/tags?apikey=' + this.supervisorKey,
		);
		const parsed = await result.json();
		if (parsed['status'] === 'success') {
			return Object.assign(
				{},
				...parsed['tags'].map((tag: BalenaTag) => {
					return { [tag.name]: tag.value };
				}),
			);
		} else {
			return {};
		}
	}

	public get_serial(): string | undefined {
		if (this.tags) {
			return this.tags['Serial'];
		} else {
			return undefined;
		}
	}
}

export function etcherProInfo(): EtcherPro | undefined {
	const BALENA_SUPERVISOR_ADDRESS = process.env.BALENA_SUPERVISOR_ADDRESS;
	const BALENA_SUPERVISOR_API_KEY = process.env.BALENA_SUPERVISOR_API_KEY;

	if (BALENA_SUPERVISOR_ADDRESS && BALENA_SUPERVISOR_API_KEY) {
		return new EtcherPro(BALENA_SUPERVISOR_ADDRESS, BALENA_SUPERVISOR_API_KEY);
	}
	return undefined;
}
