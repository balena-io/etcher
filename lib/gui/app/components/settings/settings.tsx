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
import styled from 'styled-components';

import { version } from '../../../../../package.json';
import * as settings from '../../models/settings';
import { store } from '../../models/store';
import * as analytics from '../../modules/analytics';
import { open as openExternal } from '../../os/open-external/services/open-external';

const { useState } = React;
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
	options?: any;
	hide?: boolean;
}

const settingsList: Setting[] = [
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
		name: 'trim',
		label: 'Trim ext{2,3,4} partitions before writing (raw images only)',
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
		hide: settings.get('disableUnsafeMode'),
	},
];

interface SettingsModalProps {
	toggleModal: (value: boolean) => void;
}

export const SettingsModal: any = styled(
	({ toggleModal }: SettingsModalProps) => {
		const [currentSettings, setCurrentSettings]: [
			_.Dictionary<any>,
			React.Dispatch<React.SetStateAction<_.Dictionary<any>>>,
		] = useState(settings.getAll());
		const [warning, setWarning]: [
			any,
			React.Dispatch<React.SetStateAction<any>>,
		] = useState({});

		const toggleSetting = async (setting: string, options?: any) => {
			const value = currentSettings[setting];
			const dangerous = !_.isUndefined(options);

			analytics.logEvent('Toggle setting', {
				setting,
				value,
				dangerous,
				applicationSessionUuid: store.getState().toJS().applicationSessionUuid,
			});

			if (value || !dangerous) {
				await settings.set(setting, !value);
				setCurrentSettings({
					...currentSettings,
					[setting]: !value,
				});
				setWarning({});
				return;
			}

			// Show warning since it's a dangerous setting
			setWarning({
				setting,
				settingValue: value,
				...options,
			});
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

				{_.isEmpty(warning) ? null : (
					<WarningModal
						message={warning.description}
						confirmLabel={warning.confirmLabel}
						done={() => {
							settings.set(warning.setting, !warning.settingValue);
							setCurrentSettings({
								...currentSettings,
								[warning.setting]: true,
							});
							setWarning({});
						}}
						cancel={() => {
							setWarning({});
						}}
					/>
				)}
			</Modal>
		);
	},
)`
	> div:nth-child(3) {
		justify-content: center;
	}
`;
