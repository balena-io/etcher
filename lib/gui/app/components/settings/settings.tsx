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
import { Box, Button, Flex, Checkbox, Txt } from 'rendition';
import { faTimes } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';

import { version, packageType } from '../../../../../package.json';
import * as settings from '../../models/settings';
import * as analytics from '../../modules/analytics';
import { open as openExternal } from '../../os/open-external/services/open-external';
import { Modal } from '../../styled-components';
import { unlinkSync, readFileSync } from 'fs';

const platform = os.platform();

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
			name: 'updatesEnabled',
			label: 'Auto-updates enabled',
			hide: ['rpm', 'deb'].includes(packageType),
		},
	];
}

interface SettingsModalProps {
	toggleModal: (value: boolean) => void;
}

export function SettingsModal({ toggleModal }: SettingsModalProps): any {
	const [settingsList, setCurrentSettingsList] = React.useState<Setting[]>([]);
	const [showDiagScreen, setShowDiagScreen] = React.useState<boolean>(false);
	const [diagApiIsUp, setDiagApiIsUp] = React.useState<boolean>(false);
	const [showDiagButton, setShowDiagButton] = React.useState<boolean>(false);
	const [currentSettings, setCurrentSettings] = React.useState<
		_.Dictionary<boolean>
	>({});
	const [errorMessage, setErrorMessage] = React.useState<string>('');
	let diagCount = 0;

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

	React.useEffect(() => {
		(async () => {
			try {
				const result = await fetch('http://localhost:3000/api/ping');
				if (result.ok) {
					setShowDiagButton(true);
					setDiagApiIsUp(true);
				}
			} catch {
				// no diag container
			}
		})();
	}, []);

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

		await settings.set(setting, !value);
		setCurrentSettings({
			...currentSettings,
			[setting]: !value,
		});
		return;
	};

	const closeDiagFrame = () => {
		setShowDiagScreen(false);
	};

	const openDiagFrame = () => {
		setShowDiagScreen(true);
	};

	const prepareDiag = () => {
		if (++diagCount > 5) {
			setShowDiagButton(true);
		}
	};

	const startDiag = async () => {
		unlinkSync('/usr/src/diag-data/startup.lock');

		const supUrl: string = readFileSync('/usr/src/diag-data/start.url', {
			encoding: 'utf8',
			flag: 'r',
		});
		const startRes = await fetch(supUrl, {
			method: 'POST',
			body: JSON.stringify({ serviceName: 'diag-runner', force: true }),
			headers: {
				'Content-Type': 'application/json',
			},
		});

		if (startRes.ok) {
			// good
		} else {
			setErrorMessage(`${errorMessage} :: ${startRes.statusText}`);
		}
	};

	const removeDiag = async () => {
		setErrorMessage('');
		try {
			const supervisorUrl = await (
				await fetch(`http://localhost:3000/api/supervisor/url`)
			).text();
			const supervisorApiKey = await (
				await fetch(`http://localhost:3000/api/supervisor/apiKey`)
			).text();
			const appId = await (
				await fetch(`http://localhost:3000/api/supervisor/appid`)
			).text();
			const createLock = await fetch(
				`http://localhost:3000/api/supervisor/createlock`,
			);

			const stopRes = await fetch(
				`${supervisorUrl}/v2/applications/${appId}/stop-service?apikey=${supervisorApiKey}`,
				{
					method: 'POST',
					body: JSON.stringify({ serviceName: 'diag-runner', force: true }),
					headers: {
						'Content-Type': 'application/json',
					},
				},
			);

			if (!stopRes.ok) {
				setErrorMessage(`Stop call failed | ${stopRes.statusText}`);
			}

			if (!createLock.ok) {
				setErrorMessage(`${errorMessage} :: Create lock file failed :: `);
			}
		} catch (err) {
			setErrorMessage(err);
		}
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
					return setting.hide ? null : (
						<Flex key={setting.name} mb={14}>
							<Checkbox
								toggle
								tabIndex={6 + i}
								label={setting.label}
								checked={currentSettings[setting.name]}
								onChange={() => toggleSetting(setting.name, setting.options)}
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
					onClick={() => {
						openExternal(
							'https://github.com/balena-io/etcher/blob/master/CHANGELOG.md',
						);
						prepareDiag();
					}}
				>
					<GithubSvg
						height="1em"
						fill="currentColor"
						style={{ marginRight: 8 }}
					/>
					<Txt style={{ borderBottom: '1px solid #00aeef' }}>{version}</Txt>
				</Flex>
				{showDiagButton ? (
					<Box>
						{diagApiIsUp ? (
							<>
								<Button primary onClick={() => openDiagFrame()}>
									Open Diagnostics
								</Button>
								<Button danger onClick={() => removeDiag()}>
									Stop container
								</Button>
							</>
						) : (
							<>
								<Button primary onClick={() => startDiag()}>
									Start diag container
								</Button>
							</>
						)}
						<Txt>{errorMessage}</Txt>
					</Box>
				) : (
					<></>
				)}
			</Flex>

			{showDiagScreen ? (
				<>
					<Button
						plain
						onClick={() => closeDiagFrame()}
						className="add-fab"
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
