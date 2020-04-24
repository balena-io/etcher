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

import { faFile, faLink } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { sourceDestination } from 'etcher-sdk';
import * as _ from 'lodash';
import { GPTPartition, MBRPartition } from 'partitioninfo';
import * as path from 'path';
import * as React from 'react';
import { ButtonProps, Card as BaseCard, Input, Modal, Txt } from 'rendition';
import styled from 'styled-components';

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
	StepButton,
	StepNameButton,
	StepSelection,
} from '../../styled-components';
import { colors } from '../../theme';
import { middleEllipsis } from '../../utils/middle-ellipsis';
import { SVGIcon } from '../svg-icon/svg-icon';

const recentUrlImagesKey = 'recentUrlImages';

function normalizeRecentUrlImages(urls: any): string[] {
	if (!Array.isArray(urls)) {
		urls = [];
	}
	return _.chain(urls)
		.filter(_.isString)
		.reject(_.isEmpty)
		.uniq()
		.takeRight(5)
		.value();
}

function getRecentUrlImages(): string[] {
	let urls = [];
	try {
		urls = JSON.parse(localStorage.getItem(recentUrlImagesKey) || '[]');
	} catch {
		// noop
	}
	return normalizeRecentUrlImages(urls);
}

function setRecentUrlImages(urls: string[]) {
	localStorage.setItem(
		recentUrlImagesKey,
		JSON.stringify(normalizeRecentUrlImages(urls)),
	);
}

const Card = styled(BaseCard)`
	hr {
		margin: 5px 0;
	}
`;

// TODO move these styles to rendition
const ModalText = styled.p`
	a {
		color: rgb(0, 174, 239);

		&:hover {
			color: rgb(0, 139, 191);
		}
	}
`;

function getState() {
	return {
		hasImage: selectionState.hasImage(),
		imageName: selectionState.getImageName(),
		imageSize: selectionState.getImageSize(),
	};
}

const URLSelector = ({ done }: { done: (imageURL: string) => void }) => {
	const [imageURL, setImageURL] = React.useState('');
	const [recentImages, setRecentImages]: [
		string[],
		(value: React.SetStateAction<string[]>) => void,
	] = React.useState([]);
	const [loading, setLoading] = React.useState(false);
	React.useEffect(() => {
		const fetchRecentUrlImages = async () => {
			const recentUrlImages: string[] = await getRecentUrlImages();
			setRecentImages(recentUrlImages);
		};
		fetchRecentUrlImages();
	}, []);
	return (
		<Modal
			primaryButtonProps={{
				disabled: loading,
			}}
			done={async () => {
				setLoading(true);
				const sanitizedRecentUrls = normalizeRecentUrlImages([
					...recentImages,
					imageURL,
				]);
				setRecentUrlImages(sanitizedRecentUrls);
				await done(imageURL);
			}}
		>
			<label style={{ width: '100%' }}>
				<Txt mb="10px" fontSize="20px">
					Use Image URL
				</Txt>
				<Input
					value={imageURL}
					placeholder="Enter a valid URL"
					type="text"
					onChange={(evt: React.ChangeEvent<HTMLInputElement>) =>
						setImageURL(evt.target.value)
					}
				/>
			</label>
			{!_.isEmpty(recentImages) && (
				<div>
					Recent
					<Card
						style={{ padding: '10px 15px' }}
						rows={_.map(recentImages, recent => (
							<Txt
								key={recent}
								onClick={() => {
									setImageURL(recent);
								}}
							>
								<span>
									{_.last(_.split(recent, '/'))} - {recent}
								</span>
							</Txt>
						))}
					/>
				</div>
			)}
		</Modal>
	);
};

interface Flow {
	icon?: JSX.Element;
	onClick: (evt: MouseEvent) => void;
	label: string;
}

const FlowSelector = styled(
	({ flow, ...props }: { flow: Flow; props?: ButtonProps }) => {
		return (
			<StepButton plain onClick={flow.onClick} icon={flow.icon} {...props}>
				{flow.label}
			</StepButton>
		);
	},
)`
	border-radius: 24px;

	:enabled:hover {
		background-color: ${colors.primary.background};
		color: ${colors.primary.foreground};

		svg {
			color: ${colors.primary.foreground}!important;
		}
	}
`;

export type Source =
	| typeof sourceDestination.File
	| typeof sourceDestination.Http;

export interface SourceOptions {
	imagePath: string;
	SourceType: Source;
}

interface SourceSelectorProps {
	flashing: boolean;
	afterSelected: (options: SourceOptions) => void;
}

interface SourceSelectorState {
	hasImage: boolean;
	imageName: string;
	imageSize: number;
	warning: { message: string; title: string | null } | null;
	showImageDetails: boolean;
	showURLSelector: boolean;
}

export class SourceSelector extends React.Component<
	SourceSelectorProps,
	SourceSelectorState
> {
	private unsubscribe: () => void;
	private afterSelected: SourceSelectorProps['afterSelected'];

	constructor(props: SourceSelectorProps) {
		super(props);
		this.state = {
			...getState(),
			warning: null,
			showImageDetails: false,
			showURLSelector: false,
		};

		this.openImageSelector = this.openImageSelector.bind(this);
		this.openURLSelector = this.openURLSelector.bind(this);
		this.reselectImage = this.reselectImage.bind(this);
		this.onDrop = this.onDrop.bind(this);
		this.showSelectedImageDetails = this.showSelectedImageDetails.bind(this);
		this.afterSelected = props.afterSelected.bind(this);
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

		selectionState.deselectImage();
	}

	private selectImage(
		image: sourceDestination.Metadata & {
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

	private async selectImageByPath({ imagePath, SourceType }: SourceOptions) {
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

		let source;
		if (SourceType === sourceDestination.File) {
			source = new sourceDestination.File({
				path: imagePath,
			});
		} else {
			if (
				!_.startsWith(imagePath, 'https://') &&
				!_.startsWith(imagePath, 'http://')
			) {
				const invalidImageError = errors.createUserError({
					title: 'Unsupported protocol',
					description: messages.error.unsupportedProtocol(),
				});

				osDialog.showError(invalidImageError);
				analytics.logEvent('Unsupported protocol', { path: imagePath });
				return;
			}
			source = new sourceDestination.Http(imagePath);
		}

		try {
			const innerSource = await source.getInnerSource();
			const metadata = (await innerSource.getMetadata()) as sourceDestination.Metadata & {
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
			this.afterSelected({
				imagePath,
				SourceType,
			});
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
			this.selectImageByPath({
				imagePath,
				SourceType: sourceDestination.File,
			});
		} catch (error) {
			exceptionReporter.report(error);
		}
	}

	private onDrop(event: React.DragEvent<HTMLDivElement>) {
		const [file] = event.dataTransfer.files;
		if (file) {
			this.selectImageByPath({
				imagePath: file.path,
				SourceType: sourceDestination.File,
			});
		}
	}

	private openURLSelector() {
		analytics.logEvent('Open image URL selector', {
			applicationSessionUuid:
				store.getState().toJS().applicationSessionUuid || '',
			flashingWorkflowUuid: store.getState().toJS().flashingWorkflowUuid,
		});

		this.setState({
			showURLSelector: true,
		});
	}

	private onDragOver(event: React.DragEvent<HTMLDivElement>) {
		// Needed to get onDrop events on div elements
		event.preventDefault();
	}

	private onDragEnter(event: React.DragEvent<HTMLDivElement>) {
		// Needed to get onDrop events on div elements
		event.preventDefault();
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
		const { showImageDetails, showURLSelector } = this.state;

		const hasImage = selectionState.hasImage();

		const imageBasename = hasImage
			? path.basename(selectionState.getImagePath())
			: '';
		const imageName = selectionState.getImageName();
		const imageSize = selectionState.getImageSize();

		return (
			<>
				<div
					className="box text-center relative"
					onDrop={this.onDrop}
					onDragEnter={this.onDragEnter}
					onDragOver={this.onDragOver}
				>
					<div className="center-block">
						<SVGIcon
							contents={[selectionState.getImageLogo()]}
							paths={['../../assets/image.svg']}
						/>
					</div>

					<div className="space-vertical-large">
						{hasImage ? (
							<>
								<StepNameButton
									plain
									onClick={this.showSelectedImageDetails}
									tooltip={imageBasename}
								>
									{middleEllipsis(imageName || imageBasename, 20)}
								</StepNameButton>
								{!flashing && (
									<ChangeButton plain mb={14} onClick={this.reselectImage}>
										Remove
									</ChangeButton>
								)}
								<DetailsText>
									{shared.bytesToClosestUnit(imageSize)}
								</DetailsText>
							</>
						) : (
							<StepSelection>
								<FlowSelector
									key="Flash from file"
									flow={{
										onClick: this.openImageSelector,
										label: 'Flash from file',
										icon: <FontAwesomeIcon icon={faFile} />,
									}}
								/>
								;
								<FlowSelector
									key="Flash from URL"
									flow={{
										onClick: this.openURLSelector,
										label: 'Flash from URL',
										icon: <FontAwesomeIcon icon={faLink} />,
									}}
								/>
								;
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

				{showURLSelector && (
					<URLSelector
						done={async (imagePath: string) => {
							// Avoid analytics and selection state changes
							// if no file was resolved from the dialog.
							if (!imagePath) {
								analytics.logEvent('URL selector closed', {
									applicationSessionUuid: store.getState().toJS()
										.applicationSessionUuid,
									flashingWorkflowUuid: store.getState().toJS()
										.flashingWorkflowUuid,
								});
								this.setState({
									showURLSelector: false,
								});
								return;
							}

							await this.selectImageByPath({
								imagePath,
								SourceType: sourceDestination.Http,
							});
							this.setState({
								showURLSelector: false,
							});
						}}
					/>
				)}
			</>
		);
	}
}
