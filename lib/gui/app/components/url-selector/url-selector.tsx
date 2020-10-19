import { uniqBy } from 'lodash';
import * as React from 'react';
import Checkbox from 'rendition/dist_esm5/components/Checkbox';
import { Flex } from 'rendition/dist_esm5/components/Flex';
import Input from 'rendition/dist_esm5/components/Input';
import Link from 'rendition/dist_esm5/components/Link';
import RadioButton from 'rendition/dist_esm5/components/RadioButton';
import Txt from 'rendition/dist_esm5/components/Txt';

import * as settings from '../../models/settings';
import { Modal, ScrollableFlex } from '../../styled-components';
import { openDialog } from '../../os/dialog';
import { startEllipsis } from '../../utils/start-ellipsis';

const RECENT_URL_IMAGES_KEY = 'recentUrlImages';
const SAVE_IMAGE_AFTER_FLASH_KEY = 'saveUrlImage';
const SAVE_IMAGE_AFTER_FLASH_PATH_KEY = 'saveUrlImageTo';

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
	urls = uniqBy(urls, (url) => url.href);
	return urls.slice(-5);
}

function getRecentUrlImages(): URL[] {
	let urls = [];
	try {
		urls = JSON.parse(localStorage.getItem(RECENT_URL_IMAGES_KEY) || '[]');
	} catch {
		// noop
	}
	return normalizeRecentUrlImages(urls);
}

function setRecentUrlImages(urls: string[]) {
	localStorage.setItem(RECENT_URL_IMAGES_KEY, JSON.stringify(urls));
}

export const URLSelector = ({
	done,
	cancel,
}: {
	done: (imageURL: string) => void;
	cancel: () => void;
}) => {
	const [imageURL, setImageURL] = React.useState('');
	const [recentImages, setRecentImages] = React.useState<URL[]>([]);
	const [loading, setLoading] = React.useState(false);
	const [saveImage, setSaveImage] = React.useState(false);
	const [saveImagePath, setSaveImagePath] = React.useState('');
	React.useEffect(() => {
		const fetchRecentUrlImages = async () => {
			const recentUrlImages: URL[] = await getRecentUrlImages();
			setRecentImages(recentUrlImages);
		};
		const getSaveImageSettings = async () => {
			const saveUrlImage: boolean = await settings.get(
				SAVE_IMAGE_AFTER_FLASH_KEY,
			);
			const saveUrlImageToPath: string = await settings.get(
				SAVE_IMAGE_AFTER_FLASH_PATH_KEY,
			);
			setSaveImage(saveUrlImage);
			setSaveImagePath(saveUrlImageToPath);
		};
		fetchRecentUrlImages();
		getSaveImageSettings();
	}, []);
	return (
		<Modal
			title="Use Image URL"
			cancel={cancel}
			primaryButtonProps={{
				className: loading || !imageURL ? 'disabled' : '',
			}}
			done={async () => {
				setLoading(true);
				const urlStrings = recentImages
					.map((url: URL) => url.href)
					.concat(imageURL);
				setRecentUrlImages(urlStrings);
				await done(imageURL);
			}}
		>
			<Flex flexDirection="column">
				<Flex mb="16px" width="100%" height="auto" flexDirection="column">
					<Input
						value={imageURL}
						placeholder="Enter a valid URL"
						type="text"
						onChange={(evt: React.ChangeEvent<HTMLInputElement>) =>
							setImageURL(evt.target.value)
						}
					/>
					<Flex alignItems="flex-end">
						<Checkbox
							mt="16px"
							checked={saveImage}
							onChange={(evt) => {
								const value = evt.target.checked;
								setSaveImage(value);
								settings
									.set(SAVE_IMAGE_AFTER_FLASH_KEY, value)
									.then(() => setSaveImage(value));
							}}
							label={<>Save file to:&nbsp;</>}
						/>
						<Link
							disabled={!saveImage}
							onClick={async () => {
								if (saveImage) {
									const folder = await openDialog('openDirectory');
									if (folder) {
										await settings.set(SAVE_IMAGE_AFTER_FLASH_PATH_KEY, folder);
										setSaveImagePath(folder);
									}
								}
							}}
						>
							{startEllipsis(saveImagePath, 20)}
						</Link>
					</Flex>
				</Flex>
				{recentImages.length > 0 && (
					<Flex flexDirection="column" height="58%">
						<Txt fontSize={18} mb="10px">
							Recent
						</Txt>
						<ScrollableFlex flexDirection="column" p="0">
							{recentImages
								.map((recent, i) => (
									<RadioButton
										mb={i !== 0 ? '6px' : '0'}
										key={recent.href}
										checked={imageURL === recent.href}
										label={`${recent.pathname.split('/').pop()} - ${
											recent.href
										}`}
										onChange={() => {
											setImageURL(recent.href);
										}}
										style={{
											overflowWrap: 'break-word',
										}}
									/>
								))
								.reverse()}
						</ScrollableFlex>
					</Flex>
				)}
			</Flex>
		</Modal>
	);
};

export default URLSelector;
