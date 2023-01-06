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
import { Client, createClient, createNoopClient } from 'analytics-client';
import * as SentryRenderer from '@sentry/electron/renderer';
import * as settings from '../models/settings';
import { store } from '../models/store';
import * as packageJSON from '../../../../package.json';

const clearUserPath = (filename: string): string => {
	const generatedFile = filename.split('generated').reverse()[0];
	return generatedFile !== filename ? `generated${generatedFile}` : filename;
};

export const anonymizeData = (
	event: SentryRenderer.Event,
): SentryRenderer.Event => {
	event.exception?.values?.forEach((exception) => {
		exception.stacktrace?.frames?.forEach((frame) => {
			if (frame.filename) {
				frame.filename = clearUserPath(frame.filename);
			}
		});
	});

	event.breadcrumbs?.forEach((breadcrumb) => {
		if (breadcrumb.data?.url) {
			breadcrumb.data.url = clearUserPath(breadcrumb.data.url);
		}
	});

	if (event.request?.url) {
		event.request.url = clearUserPath(event.request.url);
	}

	return event;
};

let analyticsClient: Client;
/**
 * @summary Init analytics configurations
 */
export const initAnalytics = _.once(() => {
	const dsn =
		settings.getSync('analyticsSentryToken') ||
		_.get(packageJSON, ['analytics', 'sentry', 'token']);
	SentryRenderer.init({ dsn, beforeSend: anonymizeData });

	const projectName =
		settings.getSync('analyticsAmplitudeToken') ||
		_.get(packageJSON, ['analytics', 'amplitude', 'token']);

	const clientConfig = {
		projectName,
		endpoint: 'data.balena-cloud.com',
		componentName: 'etcher',
		componentVersion: packageJSON.version,
	};
	analyticsClient = projectName
		? createClient(clientConfig)
		: createNoopClient();
});

function reportAnalytics(message: string, data: _.Dictionary<any> = {}) {
	const { applicationSessionUuid, flashingWorkflowUuid } = store
		.getState()
		.toJS();

	analyticsClient.track(message, {
		...data,
		applicationSessionUuid,
		flashingWorkflowUuid,
	});
}

/**
 * @summary Log an event
 *
 * @description
 * This function sends the debug message to product analytics services.
 */
export async function logEvent(message: string, data: _.Dictionary<any> = {}) {
	const shouldReportAnalytics = await settings.get('errorReporting');
	if (shouldReportAnalytics) {
		initAnalytics();
		reportAnalytics(message, data);
	}
}

/**
 * @summary Log an exception
 *
 * @description
 * This function logs an exception to error reporting services.
 */
export function logException(error: any) {
	const shouldReportErrors = settings.getSync('errorReporting');
	if (shouldReportErrors) {
		initAnalytics();
		console.error(error);
		SentryRenderer.captureException(error);
	}
}
