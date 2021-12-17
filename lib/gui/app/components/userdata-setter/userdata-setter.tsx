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

import * as React from 'react';
import { Flex, Txt } from 'rendition';

import { StepNameButton, Modal } from '../../styled-components';

import UserDataSvg from '../../../assets/userdata.svg';

import '../../css/modal.css';
interface UserdataSetterProps {
	disabled: boolean;
}

export const UserdataSetter = ({ disabled }: UserdataSetterProps) => {
	const [showUserdataSetterModal, setShowUserdataSetterModal] =
		React.useState(false);

	return (
		<Flex flexDirection="column" alignItems="center">
			<UserDataSvg
				className={disabled ? 'disabled' : ''}
				width="40px"
				style={{
					marginBottom: 30,
				}}
			/>

			<StepNameButton
				primary={true}
				disabled={disabled}
				onClick={() => setShowUserdataSetterModal(true)}
			>
				Set user-data
			</StepNameButton>

			{showUserdataSetterModal && (
				<Modal>
					<Flex flexDirection="column" alignItems="center">
						<Flex mb={15} style={{ width: '100%' }} flexDirection="column">
							<Txt mb="10px" fontSize="24px">
								Welcome to the user-data.yml generate wizard.
							</Txt>
						</Flex>
						<Flex
							mb={15}
							style={{ width: '100%' }}
							flexDirection="column"
							alignItems="center"
						>
							<StepNameButton
								primary={true}
								onClick={() => setShowUserdataSetterModal(false)}
							>
								{'Create New >'}
							</StepNameButton>
						</Flex>
						<Flex
							mb={15}
							style={{ width: '100%' }}
							flexDirection="column"
							alignItems="center"
						>
							<StepNameButton
								primary={true}
								// disabled={disabled}
								onClick={() => setShowUserdataSetterModal(false)}
							>
								{'Apply previously >'}
							</StepNameButton>
						</Flex>
					</Flex>
				</Modal>
			)}
		</Flex>
	);
};
