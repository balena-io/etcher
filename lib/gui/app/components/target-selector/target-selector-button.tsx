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

import ExclamationTriangleSvg from '@fortawesome/fontawesome-free/svgs/solid/exclamation-triangle.svg';
import { Drive as DrivelistDrive } from 'drivelist';
import * as React from 'react';
import { Flex, FlexProps } from 'rendition/dist_esm5/components/Flex';
import Txt from 'rendition/dist_esm5/components/Txt';

import {
	getDriveImageCompatibilityStatuses,
	Image,
} from '../../../../shared/drive-constraints';
import { bytesToClosestUnit } from '../../../../shared/units';
import { getSelectedDrives } from '../../models/selection-state';
import {
	ChangeButton,
	DetailsText,
	StepButton,
	StepNameButton,
} from '../../styled-components';
import { middleEllipsis } from '../../utils/middle-ellipsis';

interface TargetSelectorProps {
	targets: any[];
	disabled: boolean;
	openDriveSelector: () => void;
	reselectDrive: () => void;
	flashing: boolean;
	show: boolean;
	tooltip: string;
	image: Image;
}

function DriveCompatibilityWarning({
	drive,
	image,
	...props
}: {
	drive: DrivelistDrive;
	image: Image;
} & FlexProps) {
	const compatibilityWarnings = getDriveImageCompatibilityStatuses(
		drive,
		image,
	);
	if (compatibilityWarnings.length === 0) {
		return null;
	}
	const messages = compatibilityWarnings.map((warning) => warning.message);
	return (
		<Flex tooltip={messages.join(', ')} {...props}>
			<ExclamationTriangleSvg fill="currentColor" height="1em" />
		</Flex>
	);
}

export function TargetSelector(props: TargetSelectorProps) {
	const targets = getSelectedDrives();

	if (targets.length === 1) {
		const target = targets[0];
		return (
			<>
				<StepNameButton plain tooltip={props.tooltip}>
					{middleEllipsis(target.description, 20)}
				</StepNameButton>
				{!props.flashing && (
					<ChangeButton plain mb={14} onClick={props.reselectDrive}>
						Change
					</ChangeButton>
				)}
				<DetailsText>
					<DriveCompatibilityWarning
						drive={target}
						image={props.image}
						mr={2}
					/>
					{bytesToClosestUnit(target.size)}
				</DetailsText>
			</>
		);
	}

	if (targets.length > 1) {
		const targetsTemplate = [];
		for (const target of targets) {
			targetsTemplate.push(
				<DetailsText
					key={target.device}
					tooltip={`${target.description} ${
						target.displayName
					} ${bytesToClosestUnit(target.size)}`}
					px={21}
				>
					<DriveCompatibilityWarning
						drive={target}
						image={props.image}
						mr={2}
					/>
					<Txt mr={2}>{middleEllipsis(target.description, 14)}</Txt>
					<Txt>{bytesToClosestUnit(target.size)}</Txt>
				</DetailsText>,
			);
		}
		return (
			<>
				<StepNameButton plain tooltip={props.tooltip}>
					{targets.length} Targets
				</StepNameButton>
				{!props.flashing && (
					<ChangeButton plain onClick={props.reselectDrive} mb={14}>
						Change
					</ChangeButton>
				)}
				{targetsTemplate}
			</>
		);
	}

	return (
		<StepButton
			primary
			tabIndex={targets.length > 0 ? -1 : 2}
			disabled={props.disabled}
			onClick={props.openDriveSelector}
		>
			Select target
		</StepButton>
	);
}
