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

import FileSvg from '@fortawesome/fontawesome-free/svgs/solid/file.svg';
import LinkSvg from '@fortawesome/fontawesome-free/svgs/solid/link.svg';
import ExclamationTriangleSvg from '@fortawesome/fontawesome-free/svgs/solid/exclamation-triangle.svg';
import { sourceDestination } from 'etcher-sdk';
import { ipcRenderer, IpcRendererEvent } from 'electron';
import * as _ from 'lodash';
import { GPTPartition, MBRPartition } from 'partitioninfo';
import * as path from 'path';
import * as React from 'react';
import {
	Flex,
	ButtonProps,
	Modal as SmallModal,
	Txt,
	Card as BaseCard,
	Input,
} from 'rendition';
import styled from 'styled-components';

import * as errors from '../../../../shared/errors';
import * as messages from '../../../../shared/messages';
import * as supportedFormats from '../../../../shared/supported-formats';
import * as shared from '../../../../shared/units';
import * as selectionState from '../../models/selection-state';
import { observe } from '../../models/store';
import * as analytics from '../../modules/analytics';
import * as exceptionReporter from '../../modules/exception-reporter';
import * as osDialog from '../../os/dialog';
import { replaceWindowsNetworkDriveLetter } from '../../os/windows-network-drives';
import {
	ChangeButton,
	DetailsText,
	Modal,
	StepButton,
	StepNameButton,
	ScrollableFlex,
} from '../../styled-components';
import { colors } from '../../theme';
import { middleEllipsis } from '../../utils/middle-ellipsis';
import { SVGIcon } from '../svg-icon/svg-icon';

import ImageSvg from '../../../assets/image.svg';

const recentUrlImagesKey = 'recentUrlImages';

function normalizeRecentUrlImages(urls: any[]): URL[] {
	if (!Array.isArray(urls)) {
		urls = [];
	}
	urls = urls
		.map((url) => {
			try {
				return new URL(url);
			} catch (error) {
				// Invalid URL, skip
			}
		})
		.filter((url) => url !== undefined);
	urls = _.uniqBy(urls, (url) => url.href);
	return urls.slice(urls.length - 5);
}

function getRecentUrlImages(): URL[] {
	let urls = [];
	try {
		urls = JSON.parse(localStorage.getItem(recentUrlImagesKey) || '[]');
	} catch {
		// noop
	}
	return normalizeRecentUrlImages(urls);
}

function setRecentUrlImages(urls: URL[]) {
	const normalized = normalizeRecentUrlImages(urls.map((url: URL) => url.href));
	localStorage.setItem(recentUrlImagesKey, JSON.stringify(normalized));
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

const URLSelector = ({
	done,
	cancel,
}: {
	done: (imageURL: string) => void;
	cancel: () => void;
}) => {
	const [imageURL, setImageURL] = React.useState('');
	const [recentImages, setRecentImages] = React.useState<URL[]>([]);
	const [loading, setLoading] = React.useState(false);
	React.useEffect(() => {
		const fetchRecentUrlImages = async () => {
			const recentUrlImages: URL[] = await getRecentUrlImages();
			setRecentImages(recentUrlImages);
		};
		fetchRecentUrlImages();
	}, []);
	return (
		<Modal
			cancel={cancel}
			primaryButtonProps={{
				className: loading || !imageURL ? 'disabled' : '',
			}}
			done={async () => {
				setLoading(true);
				const urlStrings = recentImages.map((url: URL) => url.href);
				const normalizedRecentUrls = normalizeRecentUrlImages([
					...urlStrings,
					imageURL,
				]);
				setRecentUrlImages(normalizedRecentUrls);
				await done(imageURL);
			}}
		>
			<Flex style={{ width: '100%' }} flexDirection="column">
				<Txt mb="10px" fontSize="24px">
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
			</Flex>
			{recentImages.length > 0 && (
				<Flex flexDirection="column" height="78.6%">
					<Txt fontSize={18}>Recent</Txt>
					<ScrollableFlex flexDirection="column">
						<Card
							p="10px 15px"
							rows={recentImages
								.map((recent) => (
									<Txt
										key={recent.href}
										onClick={() => {
											setImageURL(recent.href);
										}}
										style={{
											overflowWrap: 'break-word',
										}}
									>
										{recent.pathname.split('/').pop()} - {recent.href}
									</Txt>
								))
								.reverse()}
						/>
					</ScrollableFlex>
				</Flex>
			)}
		</Modal>
	);
};

interface Flow {
	icon?: JSX.Element;
	onClick: (evt: React.MouseEvent) => void;
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
	color: rgba(255, 255, 255, 0.7);

	:enabled:hover {
		background-color: ${colors.primary.background};
		color: ${colors.primary.foreground};
		font-weight: 600;

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
	private unsubscribe: (() => void) | undefined;
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
		this.onSelectImage = this.onSelectImage.bind(this);
		this.onDrop = this.onDrop.bind(this);
		this.showSelectedImageDetails = this.showSelectedImageDetails.bind(this);
		this.afterSelected = props.afterSelected.bind(this);
	}

	public componentDidMount() {
		this.unsubscribe = observe(() => {
			this.setState(getState());
		});
		ipcRenderer.on('select-image', this.onSelectImage);
		ipcRenderer.send('source-selector-ready');
	}

	public componentWillUnmount() {
		this.unsubscribe?.();
		ipcRenderer.removeListener('select-image', this.onSelectImage);
	}

	private async onSelectImage(_event: IpcRendererEvent, imagePath: string) {
		const isURL =
			imagePath.startsWith('https://') || imagePath.startsWith('http://');
		await this.selectImageByPath({
			imagePath,
			SourceType: isURL ? sourceDestination.Http : sourceDestination.File,
		});
	}

	private reselectImage() {
		analytics.logEvent('Reselect image', {
			previousImage: selectionState.getImage(),
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
		try {
			let message = null;
			let title = null;

			if (supportedFormats.looksLikeWindowsImage(image.path)) {
				analytics.logEvent('Possibly Windows image', { image });
				message = messages.warning.looksLikeWindowsImage();
				title = 'Possible Windows image detected';
			} else if (!image.hasMBR) {
				analytics.logEvent('Missing partition table', { image });
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

		let source;
		if (SourceType === sourceDestination.File) {
			source = new sourceDestination.File({
				path: imagePath,
			});
		} else {
			if (
				!imagePath.startsWith('https://') &&
				!imagePath.startsWith('http://')
			) {
				const invalidImageError = errors.createUserError({
					title: 'Unsupported protocol',
					description: messages.error.unsupportedProtocol(),
				});

				osDialog.showError(invalidImageError);
				analytics.logEvent('Unsupported protocol', { path: imagePath });
				return;
			}
			source = new sourceDestination.Http({ url: imagePath });
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
		analytics.logEvent('Open image selector');

		try {
			const imagePath = await osDialog.selectImage();
			// Avoid analytics and selection state changes
			// if no file was resolved from the dialog.
			if (!imagePath) {
				analytics.logEvent('Image selector closed');
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
		analytics.logEvent('Open image URL selector');

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

		const imagePath = selectionState.getImagePath();
		const imageBasename = hasImage ? path.basename(imagePath) : '';
		const imageName = selectionState.getImageName();
		const imageSize = selectionState.getImageSize();
		const imageLogo = selectionState.getImageLogo();

		return (
			<>
				<Flex
					flexDirection="column"
					alignItems="center"
					onDrop={this.onDrop}
					onDragEnter={this.onDragEnter}
					onDragOver={this.onDragOver}
				>
					<SVGIcon
						contents={imageLogo}
						fallback={ImageSvg}
						style={{
							marginBottom: 30,
						}}
					/>

					{hasImage ? (
						<>
							<StepNameButton
								plain
								onClick={this.showSelectedImageDetails}
								tooltip={imageName || imageBasename}
							>
								{middleEllipsis(imageName || imageBasename, 20)}
							</StepNameButton>
							{!flashing && (
								<ChangeButton plain mb={14} onClick={this.reselectImage}>
									Remove
								</ChangeButton>
							)}
							<DetailsText>{shared.bytesToClosestUnit(imageSize)}</DetailsText>
						</>
					) : (
						<>
							<FlowSelector
								key="Flash from file"
								flow={{
									onClick: this.openImageSelector,
									label: 'Flash from file',
									icon: <FileSvg height="1em" fill="currentColor" />,
								}}
							/>
							<FlowSelector
								key="Flash from URL"
								flow={{
									onClick: this.openURLSelector,
									label: 'Flash from URL',
									icon: <LinkSvg height="1em" fill="currentColor" />,
								}}
							/>
						</>
					)}
				</Flex>

				{this.state.warning != null && (
					<SmallModal
						titleElement={
							<span>
								<ExclamationTriangleSvg fill="#fca321" height="1em" />{' '}
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
					</SmallModal>
				)}

				{showImageDetails && (
					<SmallModal
						title="Image"
						done={() => {
							this.setState({ showImageDetails: false });
						}}
					>
						<Txt.p>
							<Txt.span bold>Name: </Txt.span>
							<Txt.span>{imageName || imageBasename}</Txt.span>
						</Txt.p>
						<Txt.p>
							<Txt.span bold>Path: </Txt.span>
							<Txt.span>{imagePath}</Txt.span>
						</Txt.p>
					</SmallModal>
				)}

				{showURLSelector && (
					<URLSelector
						cancel={() => {
							this.setState({
								showURLSelector: false,
							});
						}}
						done={async (imageURL: string) => {
							// Avoid analytics and selection state changes
							// if no file was resolved from the dialog.
							if (!imageURL) {
								analytics.logEvent('URL selector closed');
								this.setState({
									showURLSelector: false,
								});
								return;
							}

							await this.selectImageByPath({
								imagePath: imageURL,
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
