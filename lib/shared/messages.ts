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

import { Dictionary } from 'lodash';
import { outdent } from 'outdent';
import prettyBytes from 'pretty-bytes';
import '../gui/app/i18n';
import * as i18next from 'i18next';

export const progress: Dictionary<(quantity: number) => string> = {
	successful: (quantity: number) => {
		return i18next.t('message.flashSucceed', { count: quantity });
	},

	failed: (quantity: number) => {
		return i18next.t('message.flashFail', { count: quantity });
	},
};

export const info = {
	flashComplete: (
		imageBasename: string,
		[drive]: [{ description: string; displayName: string }],
		{ failed, successful }: { failed: number; successful: number },
	) => {
		const targets = [];
		if (failed + successful === 1) {
			targets.push(
				i18next.t('message.toDrive', {
					description: drive.description,
					name: drive.displayName,
				}),
			);
		} else {
			if (successful) {
				targets.push(
					i18next.t('message.toTarget', {
						count: successful,
						num: successful,
					}),
				);
			}
			if (failed) {
				targets.push(
					i18next.t('message.andFailTarget', { count: failed, num: failed }),
				);
			}
		}
		return i18next.t('message.succeedTo', {
			name: imageBasename,
			target: targets.join(' '),
		});
	},
};

export const compatibility = {
	sizeNotRecommended: () => {
		return i18next.t('message.sizeNotRecommended');
	},

	tooSmall: () => {
		return i18next.t('message.tooSmall');
	},

	locked: () => {
		return i18next.t('message.locked');
	},

	system: () => {
		return i18next.t('message.system');
	},

	containsImage: () => {
		return i18next.t('message.containsImage');
	},

	// The drive is large and therefore likely not a medium you want to write to.
	largeDrive: () => {
		return i18next.t('message.largeDrive');
	},
} as const;

export const warning = {
	tooSmall: (source: { size: number }, target: { size: number }) => {
		return outdent({ newline: ' ' })`
			 ${i18next.t('message.sourceLarger', {
					byte: prettyBytes(source.size - target.size),
				})}
		`;
	},

	exitWhileFlashing: () => {
		return i18next.t('message.exitWhileFlashing');
	},

	looksLikeWindowsImage: () => {
		return i18next.t('message.looksLikeWindowsImage');
	},

	missingPartitionTable: () => {
		return i18next.t('message.missingPartitionTable', {
			type: i18next.t('message.image'),
		});
	},

	driveMissingPartitionTable: () => {
		return i18next.t('message.missingPartitionTable', {
			type: i18next.t('message.drive'),
		});
	},

	largeDriveSize: () => {
		return i18next.t('message.largeDriveSize');
	},

	systemDrive: () => {
		return i18next.t('message.systemDrive');
	},

	sourceDrive: () => {
		return i18next.t('message.sourceDrive');
	},
};

export const error = {
	notEnoughSpaceInDrive: () => {
		return i18next.t('message.noSpace');
	},

	genericFlashError: (err: Error) => {
		return i18next.t('message.genericFlashError', { error: err.message });
	},

	validation: () => {
		return i18next.t('message.validation');
	},

	openSource: (sourceName: string, errorMessage: string) => {
		return i18next.t('message.openError', {
			source: sourceName,
			error: errorMessage,
		});
	},

	flashFailure: (
		imageBasename: string,
		drives: Array<{ description: string; displayName: string }>,
	) => {
		const target =
			drives.length === 1
				? i18next.t('message.toDrive', {
						description: drives[0].description,
						name: drives[0].displayName,
					})
				: i18next.t('message.toTarget', {
						count: drives.length,
						num: drives.length,
					});
		return i18next.t('message.flashError', {
			image: imageBasename,
			targets: target,
		});
	},

	driveUnplugged: () => {
		return i18next.t('message.unplug');
	},

	inputOutput: () => {
		return i18next.t('message.cannotWrite');
	},

	childWriterDied: () => {
		return i18next.t('message.childWriterDied');
	},

	unsupportedProtocol: () => {
		return i18next.t('message.badProtocol');
	},
};
