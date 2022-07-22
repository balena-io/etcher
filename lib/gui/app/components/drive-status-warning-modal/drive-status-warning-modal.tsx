import ExclamationTriangleSvg from '@fortawesome/fontawesome-free/svgs/solid/exclamation-triangle.svg';
import * as _ from 'lodash';
import * as React from 'react';
import { Badge, Flex, Txt, ModalProps } from 'rendition';
import { Modal, ScrollableFlex } from '../../styled-components';
import { middleEllipsis } from '../../utils/middle-ellipsis';

import * as prettyBytes from 'pretty-bytes';
import { DriveWithWarnings } from '../../pages/main/Flash';
import * as i18next from 'i18next';

const DriveStatusWarningModal = ({
	done,
	cancel,
	isSystem,
	drivesWithWarnings,
}: ModalProps & {
	isSystem: boolean;
	drivesWithWarnings: DriveWithWarnings[];
}) => {
	let warningSubtitle = i18next.t('drives.largeDriveWarning');
	let warningCta = i18next.t('drives.largeDriveWarningMsg');

	if (isSystem) {
		warningSubtitle = i18next.t('drives.systemDriveWarning');
		warningCta = i18next.t('drives.systemDriveWarningMsg');
	}
	return (
		<Modal
			footerShadow={false}
			reverseFooterButtons={true}
			done={done}
			cancel={cancel}
			cancelButtonProps={{
				primary: false,
				warning: true,
				children: i18next.t('drives.changeTarget'),
			}}
			action={i18next.t('sure')}
			primaryButtonProps={{
				primary: false,
				outline: true,
			}}
		>
			<Flex
				flexDirection="column"
				alignItems="center"
				justifyContent="center"
				width="100%"
			>
				<Flex flexDirection="column">
					<ExclamationTriangleSvg height="2em" fill="#fca321" />
					<Txt fontSize="24px" color="#fca321">
						{i18next.t('warning')}
					</Txt>
				</Flex>
				<Txt fontSize="24px">{warningSubtitle}</Txt>
				<ScrollableFlex
					flexDirection="column"
					backgroundColor="#fff5e6"
					m="2em 0"
					p="1em 2em"
					width="420px"
					maxHeight="100px"
				>
					{drivesWithWarnings.map((drive, i, array) => (
						<>
							<Flex justifyContent="space-between" alignItems="baseline">
								<strong>{middleEllipsis(drive.description, 28)}</strong>{' '}
								{drive.size && prettyBytes(drive.size) + ' '}
								<Badge shade={5}>{drive.statuses[0].message}</Badge>
							</Flex>
							{i !== array.length - 1 ? <hr style={{ width: '100%' }} /> : null}
						</>
					))}
				</ScrollableFlex>
				<Txt style={{ fontWeight: 600 }}>{warningCta}</Txt>
			</Flex>
		</Modal>
	);
};

export default DriveStatusWarningModal;
