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

import * as sdk from 'etcher-sdk';
import * as _ from 'lodash';
import { GPTPartition, MBRPartition } from 'partitioninfo';
import * as path from 'path';
import * as React from 'react';
import { default as Dropzone } from 'react-dropzone';
import { Modal } from 'rendition';
import { default as styled } from 'styled-components';

import * as errors from '../../../../shared/errors';
import * as messages from '../../../../shared/messages';
import * as supportedFormats from '../../../../shared/supported-formats';
import * as shared from '../../../../shared/units';
import * as selectionState from '../../models/selection-state';
import { observe, store } from '../../models/store';
import * as analytics from '../../modules/analytics';
import * as exceptionReporter from '../../modules/exception-reporter';
import * as osDialog from '../../os/dialog';
import { replaceWindowsNetworkDriveLetter } from '../../os/windows-network-drives';
import {
	ChangeButton,
	DetailsText,
	Footer,
	StepButton,
	StepNameButton,
	StepSelection,
	Underline,
} from '../../styled-components';
import { middleEllipsis } from '../../utils/middle-ellipsis';
import { SVGIcon } from '../svg-icon/svg-icon';

// TODO move these styles to rendition
const ModalText = styled.p`
	a {
		color: rgb(0, 174, 239);

		&:hover {
			color: rgb(0, 139, 191);
		}
	}
`;

const mainSupportedExtensions = _.intersection(
	['img', 'iso', 'zip'],
	supportedFormats.getAllExtensions(),
);

const extraSupportedExtensions = _.difference(
	supportedFormats.getAllExtensions(),
	mainSupportedExtensions,
).sort();

function getState() {
	return {
		hasImage: selectionState.hasImage(),
		imageName: selectionState.getImageName(),
		imageSize: selectionState.getImageSize(),
	};
}

interface ImageSelectorProps {
	flashing: boolean;
}

interface ImageSelectorState {
	hasImage: boolean;
	imageName: string;
	imageSize: number;
	warning: { message: string; title: string | null } | null;
	showImageDetails: boolean;
}

export class ImageSelector extends React.Component<
	ImageSelectorProps,
	ImageSelectorState
> {
	private unsubscribe: () => void;

	constructor(props: ImageSelectorProps) {
		super(props);
		this.state = {
			...getState(),
			warning: null,
			showImageDetails: false,
		};

		this.openImageSelector = this.openImageSelector.bind(this);
		this.reselectImage = this.reselectImage.bind(this);
		this.handleOnDrop = this.handleOnDrop.bind(this);
		this.showSelectedImageDetails = this.showSelectedImageDetails.bind(this);
	}

	public componentDidMount() {
		this.unsubscribe = observe(() => {
			this.setState(getState());
		});
	}

	public componentWillUnmount() {
		this.unsubscribe();
	}

	private reselectImage() {
		analytics.logEvent('Reselect image', {
			previousImage: selectionState.getImage(),
			applicationSessionUuid: store.getState().toJS().applicationSessionUuid,
			flashingWorkflowUuid: store.getState().toJS().flashingWorkflowUuid,
		});

		this.openImageSelector();
	}

	private selectImage(
		image: sdk.sourceDestination.Metadata & {
			path: string;
			extension: string;
			hasMBR: boolean;
		},
	) {
		if (!supportedFormats.isSupportedImage(image.path)) {
			const invalidImageError = errors.createUserError({
				title: 'Invalid image',
				description: messages.error.invalidImage(image.path),
			});

			osDialog.showError(invalidImageError);
			analytics.logEvent(
				'Invalid image',
				_.merge(
					{
						applicationSessionUuid: store.getState().toJS()
							.applicationSessionUuid,
						flashingWorkflowUuid: store.getState().toJS().flashingWorkflowUuid,
					},
					image,
				),
			);
			return;
		}

		try {
			let message = null;
			let title = null;

			if (supportedFormats.looksLikeWindowsImage(image.path)) {
				analytics.logEvent('Possibly Windows image', {
					image,
					applicationSessionUuid: store.getState().toJS()
						.applicationSessionUuid,
					flashingWorkflowUuid: store.getState().toJS().flashingWorkflowUuid,
				});
				message = messages.warning.looksLikeWindowsImage();
				title = 'Possible Windows image detected';
			} else if (!image.hasMBR) {
				analytics.logEvent('Missing partition table', {
					image,
					applicationSessionUuid: store.getState().toJS()
						.applicationSessionUuid,
					flashingWorkflowUuid: store.getState().toJS().flashingWorkflowUuid,
				});
				title = 'Missing partition table';
				message = messages.warning.missingPartitionTable();
			}

			if (message) {
				this.setState({
					warning: {
						message,
						title,
					},
				});
				return;
			}

			selectionState.selectImage(image);
			analytics.logEvent('Select image', {
				// An easy way so we can quickly identify if we're making use of
				// certain features without printing pages of text to DevTools.
				image: {
					...image,
					logo: Boolean(image.logo),
					blockMap: Boolean(image.blockMap),
				},
				applicationSessionUuid: store.getState().toJS().applicationSessionUuid,
				flashingWorkflowUuid: store.getState().toJS().flashingWorkflowUuid,
			});
		} catch (error) {
			exceptionReporter.report(error);
		}
	}

	private async selectImageByPath(imagePath: string) {
		try {
			imagePath = await replaceWindowsNetworkDriveLetter(imagePath);
		} catch (error) {
			analytics.logException(error);
		}
		if (!supportedFormats.isSupportedImage(imagePath)) {
			const invalidImageError = errors.createUserError({
				title: 'Invalid image',
				description: messages.error.invalidImage(imagePath),
			});

			osDialog.showError(invalidImageError);
			analytics.logEvent('Invalid image', { path: imagePath });
			return;
		}

		const source = new sdk.sourceDestination.File(
			imagePath,
			sdk.sourceDestination.File.OpenFlags.Read,
		);
		try {
			const innerSource = await source.getInnerSource();
			const metadata = (await innerSource.getMetadata()) as sdk.sourceDestination.Metadata & {
				hasMBR: boolean;
				partitions: MBRPartition[] | GPTPartition[];
				path: string;
				extension: string;
			};
			const partitionTable = await innerSource.getPartitionTable();
			if (partitionTable) {
				metadata.hasMBR = true;
				metadata.partitions = partitionTable.partitions;
			} else {
				metadata.hasMBR = false;
			}
			metadata.path = imagePath;
			metadata.extension = path.extname(imagePath).slice(1);
			this.selectImage(metadata);
		} catch (error) {
			const imageError = errors.createUserError({
				title: 'Error opening image',
				description: messages.error.openImage(
					path.basename(imagePath),
					error.message,
				),
			});
			osDialog.showError(imageError);
			analytics.logException(error);
		} finally {
			try {
				await source.close();
			} catch (error) {
				// Noop
			}
		}
	}

	private async openImageSelector() {
		analytics.logEvent('Open image selector', {
			applicationSessionUuid: store.getState().toJS().applicationSessionUuid,
			flashingWorkflowUuid: store.getState().toJS().flashingWorkflowUuid,
		});

		try {
			const imagePath = await osDialog.selectImage();
			// Avoid analytics and selection state changes
			// if no file was resolved from the dialog.
			if (!imagePath) {
				analytics.logEvent('Image selector closed', {
					applicationSessionUuid: store.getState().toJS()
						.applicationSessionUuid,
					flashingWorkflowUuid: store.getState().toJS().flashingWorkflowUuid,
				});
				return;
			}
			this.selectImageByPath(imagePath);
		} catch (error) {
			exceptionReporter.report(error);
		}
	}

	private handleOnDrop(acceptedFiles: Array<{ path: string }>) {
		const [file] = acceptedFiles;

		if (file) {
			this.selectImageByPath(file.path);
		}
	}

	private showSelectedImageDetails() {
		analytics.logEvent('Show selected image tooltip', {
			imagePath: selectionState.getImagePath(),
			flashingWorkflowUuid: store.getState().toJS().flashingWorkflowUuid,
			applicationSessionUuid: store.getState().toJS().applicationSessionUuid,
		});

		this.setState({
			showImageDetails: true,
		});
	}

	// TODO add a visual change when dragging a file over the selector
	public render() {
		const { flashing } = this.props;
		const { showImageDetails } = this.state;

		const hasImage = selectionState.hasImage();

		const imageBasename = hasImage
			? path.basename(selectionState.getImagePath())
			: '';
		const imageName = selectionState.getImageName();
		const imageSize = selectionState.getImageSize();

		return (
			<React.Fragment>
				<div className="box text-center relative">
					<Dropzone multiple={false} onDrop={this.handleOnDrop}>
						{({ getRootProps, getInputProps }) => (
							<div className="center-block" {...getRootProps()}>
								<input {...getInputProps()} />
								<SVGIcon
									contents={[selectionState.getImageLogo()]}
									paths={['../../assets/image.svg']}
								/>
							</div>
						)}
					</Dropzone>

					<div className="space-vertical-large">
						{hasImage ? (
							<React.Fragment>
								<StepNameButton
									plain
									onClick={this.showSelectedImageDetails}
									tooltip={imageBasename}
								>
									{middleEllipsis(imageName || imageBasename, 20)}
								</StepNameButton>
								{!flashing && (
									<ChangeButton plain mb={14} onClick={this.reselectImage}>
										Change
									</ChangeButton>
								)}
								<DetailsText>
									{shared.bytesToClosestUnit(imageSize)}
								</DetailsText>
							</React.Fragment>
						) : (
							<StepSelection>
								<StepButton onClick={this.openImageSelector}>
									Select image
								</StepButton>
								<Footer>
									{mainSupportedExtensions.join(', ')}, and{' '}
									<Underline tooltip={extraSupportedExtensions.join(', ')}>
										many more
									</Underline>
								</Footer>
							</StepSelection>
						)}
					</div>
				</div>

				{this.state.warning != null && (
					<Modal
						titleElement={
							<span>
								<span
									style={{ color: '#d9534f' }}
									className="glyphicon glyphicon-exclamation-sign"
								></span>{' '}
								<span>{this.state.warning.title}</span>
							</span>
						}
						action="Continue"
						cancel={() => {
							this.setState({ warning: null });
							this.reselectImage();
						}}
						done={() => {
							this.setState({ warning: null });
						}}
						primaryButtonProps={{ warning: true, primary: false }}
					>
						<ModalText
							dangerouslySetInnerHTML={{ __html: this.state.warning.message }}
						/>
					</Modal>
				)}

				{showImageDetails && (
					<Modal
						title="Image File Name"
						done={() => {
							this.setState({ showImageDetails: false });
						}}
					>
						{selectionState.getImagePath()}
					</Modal>
				)}
			</React.Fragment>
		);
	}
}
