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

import { faGithub } from '@fortawesome/free-brands-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import * as _ from 'lodash';
import * as os from 'os';
import * as React from 'react';
import { Badge, Checkbox, Modal } from 'rendition';

import { version } from '../../../../../package.json';
import * as settings from '../../models/settings';
import * as analytics from '../../modules/analytics';
import { open as openExternal } from '../../os/open-external/services/open-external';

const platform = os.platform();

interface WarningModalProps {
	message: string;
	confirmLabel: string;
	cancel: () => void;
	done: () => void;
}

const WarningModal = ({
	message,
	confirmLabel,
	cancel,
	done,
}: WarningModalProps) => {
	return (
		<Modal
			title={confirmLabel}
			action={confirmLabel}
			cancel={cancel}
			done={done}
			style={{
				width: 420,
				height: 300,
			}}
			primaryButtonProps={{ warning: true }}
		>
			{message}
		</Modal>
	);
};

interface Setting {
	name: string;
	label: string | JSX.Element;
	options?: {
		description: string;
		confirmLabel: string;
	};
	hide?: boolean;
}

async function getSettingsList(): Promise<Setting[]> {
	return [
		{
			name: 'errorReporting',
			label: 'Anonymously report errors and usage statistics to balena.io',
		},
		{
			name: 'unmountOnSuccess',
			/**
			 * On Windows, "Unmounting" basically means "ejecting".
			 * On top of that, Windows users are usually not even
			 * familiar with the meaning of "unmount", which comes
			 * from the UNIX world.
			 */
			label: `${platform === 'win32' ? 'Eject' : 'Auto-unmount'} on success`,
		},
		{
			name: 'validateWriteOnSuccess',
			label: 'Validate write on success',
		},
		{
			name: 'updatesEnabled',
			label: 'Auto-updates enabled',
		},
		{
			name: 'unsafeMode',
			label: (
				<span>
					Unsafe mode{' '}
					<Badge danger fontSize={12}>
						Dangerous
					</Badge>
				</span>
			),
			options: {
				description: `Are you sure you want to turn this on?
				You will be able to overwrite your system drives if you're not careful.`,
				confirmLabel: 'Enable unsafe mode',
			},
			hide: await settings.get('disableUnsafeMode'),
		},
	];
}

interface Warning {
	setting: string;
	settingValue: boolean;
	description: string;
	confirmLabel: string;
}

interface SettingsModalProps {
	toggleModal: (value: boolean) => void;
}

export function SettingsModal({ toggleModal }: SettingsModalProps) {
	const [settingsList, setCurrentSettingsList] = React.useState<Setting[]>([]);
	React.useEffect(() => {
		(async () => {
			if (settingsList.length === 0) {
				setCurrentSettingsList(await getSettingsList());
			}
		})();
	});
	const [currentSettings, setCurrentSettings] = React.useState<
		_.Dictionary<boolean>
	>({});
	React.useEffect(() => {
		(async () => {
			if (_.isEmpty(currentSettings)) {
				setCurrentSettings(await settings.getAll());
			}
		})();
	});
	const [warning, setWarning] = React.useState<Warning | undefined>(undefined);

	const toggleSetting = async (
		setting: string,
		options?: Setting['options'],
	) => {
		const value = currentSettings[setting];
		const dangerous = options !== undefined;

		analytics.logEvent('Toggle setting', {
			setting,
			value,
			dangerous,
		});

		if (value || options === undefined) {
			await settings.set(setting, !value);
			setCurrentSettings({
				...currentSettings,
				[setting]: !value,
			});
			setWarning(undefined);
			return;
		} else {
			// Show warning since it's a dangerous setting
			setWarning({
				setting,
				settingValue: value,
				...options,
			});
		}
	};

	return (
		<Modal
			id="settings-modal"
			title="Settings"
			done={() => toggleModal(false)}
			style={{
				width: 780,
				height: 420,
			}}
		>
			<div>
				{_.map(settingsList, (setting: Setting, i: number) => {
					return setting.hide ? null : (
						<div key={setting.name}>
							<Checkbox
								toggle
								tabIndex={6 + i}
								label={setting.label}
								checked={currentSettings[setting.name]}
								onChange={() => toggleSetting(setting.name, setting.options)}
							/>
						</div>
					);
				})}
				<div>
					<span
						onClick={() =>
							openExternal(
								'https://github.com/balena-io/etcher/blob/master/CHANGELOG.md',
							)
						}
					>
						<FontAwesomeIcon icon={faGithub} /> {version}
					</span>
				</div>
			</div>

			{warning === undefined ? null : (
				<WarningModal
					message={warning.description}
					confirmLabel={warning.confirmLabel}
					done={async () => {
						await settings.set(warning.setting, !warning.settingValue);
						setCurrentSettings({
							...currentSettings,
							[warning.setting]: true,
						});
						setWarning(undefined);
					}}
					cancel={() => {
						setWarning(undefined);
					}}
				/>
			)}
		</Modal>
	);
}
