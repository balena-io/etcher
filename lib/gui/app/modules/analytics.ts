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

import { findLastIndex, once } from 'lodash';
import * as SentryRenderer from '@sentry/electron/renderer';
import * as settings from '../models/settings';

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
	const startCutIndex = findLastIndex(segments, (segment) =>
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

/**
 * @summary Init analytics configurations
 */
export const initAnalytics = once(() => {
	const dsn =
		settings.getSync('analyticsSentryToken') || process.env.SENTRY_TOKEN;
	SentryRenderer.init({
		dsn,
		beforeSend: anonymizeSentryData,
		debug: process.env.ETCHER_SENTRY_DEBUG === 'true',
	});
});

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
