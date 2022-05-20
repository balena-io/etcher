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
import * as React from 'react';

import { Box, Button, Flex, Checkbox, TextWithCopy, Txt } from 'rendition';
import { faTimes, faChartBar } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';

import { version, packageType } from '../../../../../package.json';
import * as settings from '../../models/settings';
import * as analytics from '../../modules/analytics';
import { open as openExternal } from '../../os/open-external/services/open-external';
import { Modal } from '../../styled-components';

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

const UUID = process.env.BALENA_DEVICE_UUID;

const InfoBox = (props: any) => (
	<Box fontSize={14}>
		<Txt>{props.label}</Txt>
		<TextWithCopy code text={props.value} copy={props.value} />
	</Box>
);

export function SettingsModal({ toggleModal }: SettingsModalProps) {
	const [settingsList, setCurrentSettingsList] = React.useState<Setting[]>([]);
	const [showDiagScreen, setShowDiagScreen] = React.useState<boolean>(false);
	const [currentSettings, setCurrentSettings] = React.useState<
		_.Dictionary<boolean>
	>({});

	React.useEffect(() => {
		(async () => {
			if (settingsList.length === 0) {
				setCurrentSettingsList(await getSettingsList());
			}
		})();
	});

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

	const closeDiagFrame = () => {
		setShowDiagScreen(false);
	};

	const openDiagFrame = () => {
		setShowDiagScreen(true);
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
				{UUID !== undefined && (
					<Flex flexDirection="column">
						<Txt fontSize={24}>System Information</Txt>
						<InfoBox label="UUID" value={UUID.substr(0, 7)} />
					</Flex>
				)}
				<Flex
					mt={18}
					alignItems="center"
					color="#00aeef"
					style={{
						width: 'fit-content',
						cursor: 'pointer',
						fontSize: 14,
					}}
					onClick={() => {
						openExternal(
							'https://github.com/balena-io/etcher/blob/master/CHANGELOG.md',
						);
					}}
				>
					<GithubSvg
						height="1em"
						fill="currentColor"
						style={{ marginRight: 8 }}
					/>
					<Txt style={{ borderBottom: '1px solid #00aeef' }}>{version}</Txt>
				</Flex>
				<Flex
					mt={18}
					alignItems="center"
					color="#00aeef"
					style={{
						width: 'fit-content',
						cursor: 'pointer',
						fontSize: 14,
					}}
					onClick={() => openDiagFrame()}
				>
					<FontAwesomeIcon
						icon={faChartBar}
						height="1em"
						fill="currentColor"
						style={{ marginRight: 8 }}
					/>
					<Txt style={{ borderBottom: '1px solid #00aeef' }}>Run self-test</Txt>
				</Flex>
			</Flex>

			{showDiagScreen ? (
				<>
					<Button
						plain
						onClick={() => closeDiagFrame()}
						className="add-fab"
						color="#00aeef"
						padding="13px"
						style={{
							borderRadius: '100%',
							position: 'fixed',
							top: '17px',
							right: '3px',
							height: '27px',
							width: '23px',
							zIndex: 555,
						}}
						width={23}
						icon={<FontAwesomeIcon icon={faTimes} />}
					/>
					<iframe
						className="App-frame"
						src={`http://localhost:3000/diagsteps/start`}
						title="screen"
						key="screen-frame"
						style={{
							position: 'fixed',
							top: '0px',
							bottom: '0px',
							left: '0px',
							right: '0px',
							border: 'none',
							width: '100%',
							height: '100%',
							margin: 0,
							padding: 0,
							backgroundColor: 'white',
						}}
					></iframe>
				</>
			) : (
				<></>
			)}
		</Modal>
	);
}
