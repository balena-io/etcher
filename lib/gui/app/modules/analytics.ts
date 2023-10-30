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

type AnalyticsPayload = _.Dictionary<any>;

const clearUserPath = (filename: string): string => {
	const generatedFile = filename.split('generated').reverse()[0];
	return generatedFile !== filename ? `generated${generatedFile}` : filename;
};

export const anonymizeSentryData = (
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

const extractPathRegex = /(.*)(^|\s)(file:\/\/)?(\w:)?([\\/].+)/;
const etcherSegmentMarkers = ['app.asar', 'Resources'];

export const anonymizePath = (input: string) => {
	// First, extract a part of the value that matches a path pattern.
	const match = extractPathRegex.exec(input);
	if (match === null) {
		return input;
	}
	const mainPart = match[5];
	const space = match[2];
	const beginning = match[1];
	const uriPrefix = match[3] || '';

	// We have to deal with both Windows and POSIX here.
	// The path starts with its separator (we work with absolute paths).
	const sep = mainPart[0];
	const segments = mainPart.split(sep);

	// Moving from the end, find the first marker and cut the path from there.
	const startCutIndex = _.findLastIndex(segments, (segment) =>
		etcherSegmentMarkers.includes(segment),
	);
	return (
		beginning +
		space +
		uriPrefix +
		'[PERSONAL PATH]' +
		sep +
		segments.splice(startCutIndex).join(sep)
	);
};

const safeAnonymizePath = (input: string) => {
	try {
		return anonymizePath(input);
	} catch (e) {
		return '[ANONYMIZE PATH FAILED]';
	}
};

const sensitiveEtcherProperties = [
	'error.description',
	'error.message',
	'error.stack',
	'image',
	'image.path',
	'path',
];

export const anonymizeAnalyticsPayload = (
	data: AnalyticsPayload,
): AnalyticsPayload => {
	for (const prop of sensitiveEtcherProperties) {
		const value = data[prop];
		if (value != null) {
			data[prop] = safeAnonymizePath(value.toString());
		}
	}
	return data;
};

let analyticsClient: Client;
/**
 * @summary Init analytics configurations
 */
export const initAnalytics = _.once(() => {
	const dsn =
		settings.getSync('analyticsSentryToken') ||
		_.get(packageJSON, ['analytics', 'sentry', 'token']);
	SentryRenderer.init({ dsn, beforeSend: anonymizeSentryData });

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

const getCircularReplacer = () => {
	const seen = new WeakSet();
	return (key: any, value: any) => {
		if (typeof value === 'object' && value !== null) {
			if (seen.has(value)) {
				return;
			}
			seen.add(value);
		}
		return value;
	};
};

function flattenObject(obj: any) {
	const toReturn: AnalyticsPayload = {};

	for (const i in obj) {
		if (!Object.prototype.hasOwnProperty.call(obj, i)) {
			continue;
		}

		if (Array.isArray(obj[i])) {
			toReturn[i] = obj[i];
			continue;
		}

		if (typeof obj[i] === 'object' && obj[i] !== null) {
			const flatObject = flattenObject(obj[i]);
			for (const x in flatObject) {
				if (!Object.prototype.hasOwnProperty.call(flatObject, x)) {
					continue;
				}

				toReturn[i.toLowerCase() + '.' + x.toLowerCase()] = flatObject[x];
			}
		} else {
			toReturn[i] = obj[i];
		}
	}
	return toReturn;
}

function formatEvent(data: any): AnalyticsPayload {
	const event = JSON.parse(JSON.stringify(data, getCircularReplacer()));
	return anonymizeAnalyticsPayload(flattenObject(event));
}

function reportAnalytics(message: string, data: AnalyticsPayload = {}) {
	const { applicationSessionUuid, flashingWorkflowUuid } = store
		.getState()
		.toJS();

	const event = formatEvent({
		...data,
		applicationSessionUuid,
		flashingWorkflowUuid,
	});
	analyticsClient.track(message, event);
}

/**
 * @summary Log an event
 *
 * @description
 * This function sends the debug message to product analytics services.
 */
export async function logEvent(message: string, data: AnalyticsPayload = {}) {
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
	console.error(error);
	if (shouldReportErrors) {
		initAnalytics();
		SentryRenderer.captureException(error);
	}
}
