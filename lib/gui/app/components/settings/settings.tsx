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

import GithubSvg from '@fortawesome/fontawesome-free/svgs/brands/github.svg';
import * as _ from 'lodash';
import * as os from 'os';
import * as React from 'react';
import { Flex, Checkbox, Txt } from 'rendition';

import { version, packageType } from '../../../../../package.json';
import * as settings from '../../models/settings';
import * as analytics from '../../modules/analytics';
import { open as openExternal } from '../../os/open-external/services/open-external';
import { Modal } from '../../styled-components';

const platform = os.platform();

interface Setting {
	name: string;
	label: string | JSX.Element;
}

async function getSettingsList(): Promise<Setting[]> {
	const list: Setting[] = [
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
	];
	if (['appimage', 'nsis', 'dmg'].includes(packageType)) {
		list.push({
			name: 'updatesEnabled',
			label: 'Auto-updates enabled',
		});
	}
	return list;
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

	const toggleSetting = async (setting: string) => {
		const value = currentSettings[setting];
		analytics.logEvent('Toggle setting', { setting, value });
		await settings.set(setting, !value);
		setCurrentSettings({
			...currentSettings,
			[setting]: !value,
		});
	};

	return (
		<Modal
			titleElement={
				<Txt fontSize={24} mb={24}>
					Settings
				</Txt>
			}
			done={() => toggleModal(false)}
		>
			<Flex flexDirection="column">
				{settingsList.map((setting: Setting, i: number) => {
					return (
						<Flex key={setting.name} mb={14}>
							<Checkbox
								toggle
								tabIndex={6 + i}
								label={setting.label}
								checked={currentSettings[setting.name]}
								onChange={() => toggleSetting(setting.name)}
							/>
						</Flex>
					);
				})}
				<Flex
					mt={18}
					alignItems="center"
					color="#00aeef"
					style={{
						width: 'fit-content',
						cursor: 'pointer',
						fontSize: 14,
					}}
					onClick={() =>
						openExternal(
							'https://github.com/balena-io/etcher/blob/master/CHANGELOG.md',
						)
					}
				>
					<GithubSvg
						height="1em"
						fill="currentColor"
						style={{ marginRight: 8 }}
					/>
					<Txt style={{ borderBottom: '1px solid #00aeef' }}>{version}</Txt>
				</Flex>
			</Flex>
		</Modal>
	);
}
