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

import CopySvg from '@fortawesome/fontawesome-free/svgs/solid/copy.svg';
import FileSvg from '@fortawesome/fontawesome-free/svgs/solid/file.svg';
import LinkSvg from '@fortawesome/fontawesome-free/svgs/solid/link.svg';
import ExclamationTriangleSvg from '@fortawesome/fontawesome-free/svgs/solid/exclamation-triangle.svg';
import ChevronDownSvg from '@fortawesome/fontawesome-free/svgs/solid/chevron-down.svg';
import ChevronRightSvg from '@fortawesome/fontawesome-free/svgs/solid/chevron-right.svg';
import { sourceDestination } from 'etcher-sdk';
import { ipcRenderer, IpcRendererEvent } from 'electron';
import * as _ from 'lodash';
import { GPTPartition, MBRPartition } from 'partitioninfo';
import * as path from 'path';
import * as prettyBytes from 'pretty-bytes';
import * as React from 'react';
import {
	Flex,
	ButtonProps,
	Modal as SmallModal,
	Txt,
	Card as BaseCard,
	Input,
	Spinner,
	Link,
} from 'rendition';
import styled from 'styled-components';

import * as errors from '../../../../shared/errors';
import * as messages from '../../../../shared/messages';
import * as supportedFormats from '../../../../shared/supported-formats';
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
import SrcSvg from '../../../assets/src.svg';
import { DriveSelector } from '../drive-selector/drive-selector';
import { DrivelistDrive } from '../../../../shared/drive-constraints';
import axios, { AxiosRequestConfig } from 'axios';
import { isJson } from '../../../../shared/utils';
import * as i18next from 'i18next';

const recentUrlImagesKey = 'recentUrlImages';

function normalizeRecentUrlImages(urls: any[]): URL[] {
	if (!Array.isArray(urls)) {
		urls = [];
	}
	urls = urls
		.map((url) => {
			try {
				return new URL(url);
			} catch (error: any) {
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

const isURL = (imagePath: string) =>
	imagePath.startsWith('https://') || imagePath.startsWith('http://');

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
	const image = selectionState.getImage();
	return {
		hasImage: selectionState.hasImage(),
		imageName: image?.name,
		imageSize: image?.size,
	};
}

function isString(value: any): value is string {
	return typeof value === 'string';
}

const URLSelector = ({
	done,
	cancel,
}: {
	done: (imageURL: string, auth?: Authentication) => void;
	cancel: () => void;
}) => {
	const [imageURL, setImageURL] = React.useState('');
	const [recentImages, setRecentImages] = React.useState<URL[]>([]);
	const [loading, setLoading] = React.useState(false);
	const [showBasicAuth, setShowBasicAuth] = React.useState(false);
	const [username, setUsername] = React.useState('');
	const [password, setPassword] = React.useState('');
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
				disabled: loading || !imageURL,
			}}
			action={loading ? <Spinner /> : i18next.t('ok')}
			done={async () => {
				setLoading(true);
				const urlStrings = recentImages.map((url: URL) => url.href);
				const normalizedRecentUrls = normalizeRecentUrlImages([
					...urlStrings,
					imageURL,
				]);
				setRecentUrlImages(normalizedRecentUrls);
				const auth = username ? { username, password } : undefined;
				await done(imageURL, auth);
			}}
		>
			<Flex flexDirection="column">
				<Flex mb={15} style={{ width: '100%' }} flexDirection="column">
					<Txt mb="10px" fontSize="24px">
						{i18next.t('source.useSourceURL')}
					</Txt>
					<Input
						value={imageURL}
						placeholder={i18next.t('source.enterValidURL')}
						type="text"
						onChange={(evt: React.ChangeEvent<HTMLInputElement>) =>
							setImageURL(evt.target.value)
						}
					/>
					<Link
						mt={15}
						mb={15}
						fontSize="14px"
						onClick={() => {
							if (showBasicAuth) {
								setUsername('');
								setPassword('');
							}
							setShowBasicAuth(!showBasicAuth);
						}}
					>
						<Flex alignItems="center">
							{showBasicAuth && (
								<ChevronDownSvg height="1em" fill="currentColor" />
							)}
							{!showBasicAuth && (
								<ChevronRightSvg height="1em" fill="currentColor" />
							)}
							<Txt ml={8}>{i18next.t('source.auth')}</Txt>
						</Flex>
					</Link>
					{showBasicAuth && (
						<React.Fragment>
							<Input
								mb={15}
								value={username}
								placeholder={i18next.t('source.username')}
								type="text"
								onChange={(evt: React.ChangeEvent<HTMLInputElement>) =>
									setUsername(evt.target.value)
								}
							/>
							<Input
								value={password}
								placeholder={i18next.t('source.password')}
								type="password"
								onChange={(evt: React.ChangeEvent<HTMLInputElement>) =>
									setPassword(evt.target.value)
								}
							/>
						</React.Fragment>
					)}
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
			</Flex>
		</Modal>
	);
};

interface Flow {
	icon?: JSX.Element;
	onClick: (evt: React.MouseEvent) => void;
	label: string;
}

const FlowSelector = styled(
	({ flow, ...props }: { flow: Flow } & ButtonProps) => (
		<StepButton
			plain={!props.primary}
			primary={props.primary}
			onClick={(evt: React.MouseEvent<Element, MouseEvent>) =>
				flow.onClick(evt)
			}
			icon={flow.icon}
			{...props}
		>
			{flow.label}
		</StepButton>
	),
)`
	border-radius: 24px;
	color: rgba(255, 255, 255, 0.7);

	:enabled:focus,
	:enabled:focus svg {
		color: ${colors.primary.foreground} !important;
	}

	:enabled:hover {
		background-color: ${colors.primary.background};
		color: ${colors.primary.foreground};
		font-weight: 600;

		svg {
			color: ${colors.primary.foreground} !important;
		}
	}
`;

export type Source =
	| typeof sourceDestination.File
	| typeof sourceDestination.BlockDevice
	| typeof sourceDestination.Http;

export interface SourceMetadata extends sourceDestination.Metadata {
	hasMBR?: boolean;
	partitions?: MBRPartition[] | GPTPartition[];
	path: string;
	displayName: string;
	description: string;
	SourceType: Source;
	drive?: DrivelistDrive;
	extension?: string;
	archiveExtension?: string;
	auth?: Authentication;
}

interface SourceSelectorProps {
	flashing: boolean;
}

interface SourceSelectorState {
	hasImage: boolean;
	imageName?: string;
	imageSize?: number;
	warning: { message: string; title: string | null } | null;
	showImageDetails: boolean;
	showURLSelector: boolean;
	showDriveSelector: boolean;
	defaultFlowActive: boolean;
	imageSelectorOpen: boolean;
	imageLoading: boolean;
}

interface Authentication {
	username: string;
	password: string;
}

export class SourceSelector extends React.Component<
	SourceSelectorProps,
	SourceSelectorState
> {
	private unsubscribe: (() => void) | undefined;

	constructor(props: SourceSelectorProps) {
		super(props);
		this.state = {
			...getState(),
			warning: null,
			showImageDetails: false,
			showURLSelector: false,
			showDriveSelector: false,
			defaultFlowActive: true,
			imageSelectorOpen: false,
			imageLoading: false,
		};

		// Bind `this` since it's used in an event's callback
		this.onSelectImage = this.onSelectImage.bind(this);
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
		this.setState({ imageLoading: true });
		await this.selectSource(
			imagePath,
			isURL(this.normalizeImagePath(imagePath))
				? sourceDestination.Http
				: sourceDestination.File,
		).promise;
		this.setState({ imageLoading: false });
	}

	private async createSource(
		selected: string,
		SourceType: Source,
		auth?: Authentication,
	) {
		try {
			selected = await replaceWindowsNetworkDriveLetter(selected);
		} catch (error: any) {
			analytics.logException(error);
		}

		if (isJson(decodeURIComponent(selected))) {
			const config: AxiosRequestConfig = JSON.parse(
				decodeURIComponent(selected),
			);
			return new sourceDestination.Http({
				url: config.url!,
				axiosInstance: axios.create(_.omit(config, ['url'])),
			});
		}

		if (SourceType === sourceDestination.File) {
			return new sourceDestination.File({
				path: selected,
			});
		}

		return new sourceDestination.Http({ url: selected, auth });
	}

	public normalizeImagePath(imgPath: string) {
		const decodedPath = decodeURIComponent(imgPath);
		if (isJson(decodedPath)) {
			return JSON.parse(decodedPath).url ?? decodedPath;
		}
		return decodedPath;
	}

	private reselectSource() {
		analytics.logEvent('Reselect image', {
			previousImage: selectionState.getImage(),
		});

		selectionState.deselectImage();
	}

	private selectSource(
		selected: string | DrivelistDrive,
		SourceType: Source,
		auth?: Authentication,
	): { promise: Promise<void>; cancel: () => void } {
		let cancelled = false;
		return {
			cancel: () => {
				cancelled = true;
			},
			promise: (async () => {
				const sourcePath = isString(selected) ? selected : selected.device;
				let source;
				let metadata: SourceMetadata | undefined;
				if (isString(selected)) {
					if (
						SourceType === sourceDestination.Http &&
						!isURL(this.normalizeImagePath(selected))
					) {
						this.handleError(
							i18next.t('source.unsupportedProtocol'),
							selected,
							messages.error.unsupportedProtocol(),
						);
						return;
					}

					if (supportedFormats.looksLikeWindowsImage(selected)) {
						analytics.logEvent('Possibly Windows image', { image: selected });
						this.setState({
							warning: {
								message: messages.warning.looksLikeWindowsImage(),
								title: i18next.t('source.windowsImage'),
							},
						});
					}
					source = await this.createSource(selected, SourceType, auth);

					if (cancelled) {
						return;
					}

					try {
						const innerSource = await source.getInnerSource();
						if (cancelled) {
							return;
						}
						metadata = await this.getMetadata(innerSource, selected);
						if (cancelled) {
							return;
						}
						metadata.SourceType = SourceType;

						if (!metadata.hasMBR && this.state.warning === null) {
							analytics.logEvent('Missing partition table', { metadata });
							this.setState({
								warning: {
									message: messages.warning.missingPartitionTable(),
									title: i18next.t('source.partitionTable'),
								},
							});
						}
					} catch (error: any) {
						this.handleError(
							i18next.t('source.errorOpen'),
							sourcePath,
							messages.error.openSource(sourcePath, error.message),
							error,
						);
					} finally {
						try {
							await source.close();
						} catch (error: any) {
							// Noop
						}
					}
				} else {
					if (selected.partitionTableType === null) {
						analytics.logEvent('Missing partition table', { selected });
						this.setState({
							warning: {
								message: messages.warning.driveMissingPartitionTable(),
								title: i18next.t('source.partitionTable'),
							},
						});
					}
					metadata = {
						path: selected.device,
						displayName: selected.displayName,
						description: selected.displayName,
						size: selected.size as SourceMetadata['size'],
						SourceType: sourceDestination.BlockDevice,
						drive: selected,
					};
				}

				if (metadata !== undefined) {
					metadata.auth = auth;
					selectionState.selectSource(metadata);
					analytics.logEvent('Select image', {
						// An easy way so we can quickly identify if we're making use of
						// certain features without printing pages of text to DevTools.
						image: {
							...metadata,
							logo: Boolean(metadata.logo),
							blockMap: Boolean(metadata.blockMap),
						},
					});
				}
			})(),
		};
	}

	private handleError(
		title: string,
		sourcePath: string,
		description: string,
		error?: Error,
	) {
		const imageError = errors.createUserError({
			title,
			description,
		});
		osDialog.showError(imageError);
		if (error) {
			analytics.logException(error);
			return;
		}
		analytics.logEvent(title, { path: sourcePath });
	}

	private async getMetadata(
		source: sourceDestination.SourceDestination,
		selected: string | DrivelistDrive,
	) {
		const metadata = (await source.getMetadata()) as SourceMetadata;
		const partitionTable = await source.getPartitionTable();
		if (partitionTable) {
			metadata.hasMBR = true;
			metadata.partitions = partitionTable.partitions;
		} else {
			metadata.hasMBR = false;
		}
		if (isString(selected)) {
			metadata.extension = path.extname(selected).slice(1);
			metadata.path = selected;
		}
		return metadata;
	}

	private async openImageSelector() {
		analytics.logEvent('Open image selector');
		this.setState({ imageSelectorOpen: true });

		try {
			const imagePath = await osDialog.selectImage();
			// Avoid analytics and selection state changes
			// if no file was resolved from the dialog.
			if (!imagePath) {
				analytics.logEvent('Image selector closed');
				return;
			}
			await this.selectSource(imagePath, sourceDestination.File).promise;
		} catch (error: any) {
			exceptionReporter.report(error);
		} finally {
			this.setState({ imageSelectorOpen: false });
		}
	}

	private async onDrop(event: React.DragEvent<HTMLDivElement>) {
		const [file] = event.dataTransfer.files;
		if (file) {
			await this.selectSource(file.path, sourceDestination.File).promise;
		}
	}

	private openURLSelector() {
		analytics.logEvent('Open image URL selector');

		this.setState({
			showURLSelector: true,
		});
	}

	private openDriveSelector() {
		analytics.logEvent('Open drive selector');

		this.setState({
			showDriveSelector: true,
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
			imagePath: selectionState.getImage()?.path,
		});

		this.setState({
			showImageDetails: true,
		});
	}

	private setDefaultFlowActive(defaultFlowActive: boolean) {
		this.setState({ defaultFlowActive });
	}

	private closeModal() {
		this.setState({
			showDriveSelector: false,
		});
	}

	// TODO add a visual change when dragging a file over the selector
	public render() {
		const { flashing } = this.props;
		const {
			showImageDetails,
			showURLSelector,
			showDriveSelector,
			imageLoading,
		} = this.state;
		const selectionImage = selectionState.getImage();
		let image: SourceMetadata | DrivelistDrive =
			selectionImage !== undefined ? selectionImage : ({} as SourceMetadata);

		image = image.drive ?? image;

		let cancelURLSelection = () => {
			// noop
		};
		image.name = image.description || image.name;
		const imagePath = image.path || image.displayName || '';
		const imageBasename = path.basename(imagePath);
		const imageName = image.name || '';
		const imageSize = image.size;
		const imageLogo = image.logo || '';

		return (
			<>
				<Flex
					flexDirection="column"
					alignItems="center"
					onDrop={(evt: React.DragEvent<HTMLDivElement>) => this.onDrop(evt)}
					onDragEnter={(evt: React.DragEvent<HTMLDivElement>) =>
						this.onDragEnter(evt)
					}
					onDragOver={(evt: React.DragEvent<HTMLDivElement>) =>
						this.onDragOver(evt)
					}
				>
					<SVGIcon
						contents={imageLogo}
						fallback={ImageSvg}
						style={{
							marginBottom: 30,
						}}
					/>

					{selectionImage !== undefined || imageLoading ? (
						<>
							<StepNameButton
								plain
								onClick={() => this.showSelectedImageDetails()}
								tooltip={imageName || imageBasename}
							>
								<Spinner show={imageLoading}>
									{middleEllipsis(imageName || imageBasename, 20)}
								</Spinner>
							</StepNameButton>
							{!flashing && !imageLoading && (
								<ChangeButton
									plain
									mb={14}
									onClick={() => this.reselectSource()}
								>
									{i18next.t('cancel')}
								</ChangeButton>
							)}
							{!_.isNil(imageSize) && !imageLoading && (
								<DetailsText>{prettyBytes(imageSize)}</DetailsText>
							)}
						</>
					) : (
						<>
							<FlowSelector
								disabled={this.state.imageSelectorOpen}
								primary={this.state.defaultFlowActive}
								key="Flash from file"
								flow={{
									onClick: () => this.openImageSelector(),
									label: i18next.t('source.fromFile'),
									icon: <FileSvg height="1em" fill="currentColor" />,
								}}
								onMouseEnter={() => this.setDefaultFlowActive(false)}
								onMouseLeave={() => this.setDefaultFlowActive(true)}
							/>
							<FlowSelector
								key="Flash from URL"
								flow={{
									onClick: () => this.openURLSelector(),
									label: i18next.t('source.fromURL'),
									icon: <LinkSvg height="1em" fill="currentColor" />,
								}}
								onMouseEnter={() => this.setDefaultFlowActive(false)}
								onMouseLeave={() => this.setDefaultFlowActive(true)}
							/>
							<FlowSelector
								key="Clone drive"
								flow={{
									onClick: () => this.openDriveSelector(),
									label: i18next.t('source.clone'),
									icon: <CopySvg height="1em" fill="currentColor" />,
								}}
								onMouseEnter={() => this.setDefaultFlowActive(false)}
								onMouseLeave={() => this.setDefaultFlowActive(true)}
							/>
						</>
					)}
				</Flex>

				{this.state.warning != null && (
					<SmallModal
						style={{
							boxShadow: '0 3px 7px rgba(0, 0, 0, 0.3)',
						}}
						titleElement={
							<span>
								<ExclamationTriangleSvg fill="#fca321" height="1em" />{' '}
								<span>{this.state.warning.title}</span>
							</span>
						}
						action={i18next.t('continue')}
						cancel={() => {
							this.setState({ warning: null });
							this.reselectSource();
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
						title={i18next.t('source.image')}
						done={() => {
							this.setState({ showImageDetails: false });
						}}
					>
						<Txt.p>
							<Txt.span bold>{i18next.t('source.name')}</Txt.span>
							<Txt.span>{imageName || imageBasename}</Txt.span>
						</Txt.p>
						<Txt.p>
							<Txt.span bold>{i18next.t('source.path')}</Txt.span>
							<Txt.span>{imagePath}</Txt.span>
						</Txt.p>
					</SmallModal>
				)}

				{showURLSelector && (
					<URLSelector
						cancel={() => {
							cancelURLSelection();
							this.setState({
								showURLSelector: false,
							});
						}}
						done={async (imageURL: string, auth?: Authentication) => {
							// Avoid analytics and selection state changes
							// if no file was resolved from the dialog.
							if (!imageURL) {
								analytics.logEvent('URL selector closed');
							} else {
								let promise;
								({ promise, cancel: cancelURLSelection } = this.selectSource(
									imageURL,
									sourceDestination.Http,
									auth,
								));
								await promise;
							}
							this.setState({
								showURLSelector: false,
							});
						}}
					/>
				)}

				{showDriveSelector && (
					<DriveSelector
						write={false}
						multipleSelection={false}
						titleLabel={i18next.t('source.selectSource')}
						emptyListLabel={i18next.t('source.plugSource')}
						emptyListIcon={<SrcSvg width="40px" />}
						cancel={(originalList) => {
							if (originalList.length) {
								const originalSource = originalList[0];
								if (selectionImage?.drive?.device !== originalSource.device) {
									this.selectSource(
										originalSource,
										sourceDestination.BlockDevice,
									);
								}
							} else {
								selectionState.deselectImage();
							}
							this.closeModal();
						}}
						done={() => this.closeModal()}
						onSelect={(drive) => {
							if (drive) {
								if (
									selectionState.getImage()?.drive?.device === drive?.device
								) {
									return selectionState.deselectImage();
								}
								this.selectSource(drive, sourceDestination.BlockDevice);
							}
						}}
					/>
				)}
			</>
		);
	}
}
