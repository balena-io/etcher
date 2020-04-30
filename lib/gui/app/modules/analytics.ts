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

import * as _ from 'lodash';
import * as resinCorvus from 'resin-corvus/browser';

import * as packageJSON from '../../../../package.json';
import { getConfig, hasProps } from '../../../shared/utils';
import * as settings from '../models/settings';
import { store } from '../models/store';

const DEFAULT_PROBABILITY = 0.1;

async function installCorvus(): Promise<void> {
	const sentryToken =
		(await settings.get('analyticsSentryToken')) ||
		_.get(packageJSON, ['analytics', 'sentry', 'token']);
	const mixpanelToken =
		(await settings.get('analyticsMixpanelToken')) ||
		_.get(packageJSON, ['analytics', 'mixpanel', 'token']);
	resinCorvus.install({
		services: {
			sentry: sentryToken,
			mixpanel: mixpanelToken,
		},
		options: {
			release: packageJSON.version,
			shouldReport: () => {
				return settings.getSync('errorReporting');
			},
			mixpanelDeferred: true,
		},
	});
}

let mixpanelSample = DEFAULT_PROBABILITY;

/**
 * @summary Init analytics configurations
 */
async function initConfig() {
	await installCorvus();
	let validatedConfig = null;
	try {
		const config = await getConfig();
		const mixpanel = _.get(config, ['analytics', 'mixpanel'], {});
		mixpanelSample = mixpanel.probability || DEFAULT_PROBABILITY;
		if (isClientEligible(mixpanelSample)) {
			validatedConfig = validateMixpanelConfig(mixpanel);
		}
	} catch (err) {
		resinCorvus.logException(err);
	}
	resinCorvus.setConfigs({
		mixpanel: validatedConfig,
	});
}

initConfig();

/**
 * @summary Check that the client is eligible for analytics
 */
function isClientEligible(probability: number) {
	return Math.random() < probability;
}

/**
 * @summary Check that config has at least HTTP_PROTOCOL and api_host
 */
function validateMixpanelConfig(config: {
	api_host?: string;
	HTTP_PROTOCOL?: string;
}) {
	const mixpanelConfig = {
		api_host: 'https://api.mixpanel.com',
	};
	if (hasProps(config, ['HTTP_PROTOCOL', 'api_host'])) {
		mixpanelConfig.api_host = `${config.HTTP_PROTOCOL}://${config.api_host}`;
	}
	return mixpanelConfig;
}

/**
 * @summary Log an event
 *
 * @description
 * This function sends the debug message to product analytics services.
 */
export function logEvent(message: string, data: _.Dictionary<any> = {}) {
	const {
		applicationSessionUuid,
		flashingWorkflowUuid,
	} = store.getState().toJS();
	resinCorvus.logEvent(message, {
		...data,
		sample: mixpanelSample,
		applicationSessionUuid,
		flashingWorkflowUuid,
	});
}

/**
 * @summary Log an exception
 *
 * @description
 * This function logs an exception to error reporting services.
 */
export const logException = resinCorvus.logException;
