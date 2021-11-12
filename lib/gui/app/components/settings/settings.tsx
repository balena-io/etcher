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
import { faTimes } from '@fortawesome/free-solid-svg-icons'
  import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'

import { version, packageType } from '../../../../../package.json';
import * as settings from '../../models/settings';
import * as analytics from '../../modules/analytics';
import { open as openExternal } from '../../os/open-external/services/open-external';
import { Modal } from '../../styled-components';

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
	const [showDiagScreen, setShowDiagScreen] = React.useState<Boolean>(false);
	const [showDiagButton, setShowDiagButton] = React.useState<Boolean>(false);
	let diagClickCount = 0;

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
	}

	const openDiagFrame = () => {
		setShowDiagScreen(true);  
	}

	const prepareDiag = () => {
		if (diagClickCount > 5) {
			setShowDiagButton(true)
		}

		++diagClickCount;
	}

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
						prepareDiag()
					}
					}
				>
					<GithubSvg
						height="1em"
						fill="currentColor"
						style={{ marginRight: 8 }}
					/>
					<Txt style={{ borderBottom: '1px solid #00aeef' }}>{version}</Txt>					
				</Flex>
				{showDiagButton ? <Box>
					<Button primary onClick={() => openDiagFrame()}>Open Diagnostics {window.location.hostname}</Button>
				</Box> : <></>}
			</Flex>

			{showDiagScreen ? <>
			<Button 
				primary
				onClick={() => closeDiagFrame()}
				className="add-fab"
				padding='13px'
				style={{ 
					borderRadius: '100%', 
					position: "fixed",
					top: "23px",
					right: "15px",
					height: "27px",
					width: "23px",
					zIndex: 999 }
				}
				width={23}
				icon={<FontAwesomeIcon icon={faTimes}/>}
			/>
			<iframe 
				className="App-frame" 
				src={`http://localhost:8000`} 
				title='screen' 
				key="screen-frame"
				style={{
					position: "fixed",
					top: "0px",
					bottom: "0px",
					left: "0px",
					right: "0px",
					minWidth: "100vw",
					minHeight: "100vh",
					border: "none",
					margin: 0,
					padding: 0,
					backgroundColor: "#282c34",
					color: "white" }
				}
			>
			</iframe>
			</> : <></>}
		</Modal>
	);
}
