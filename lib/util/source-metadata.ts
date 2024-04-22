/** Get metadata for a source */

import { sourceDestination } from 'etcher-sdk';
import { replaceWindowsNetworkDriveLetter } from '../gui/app/os/windows-network-drives';
import axios, { AxiosRequestConfig } from 'axios';
import { isJson } from '../shared/utils';
import * as path from 'path';
import {
	SourceMetadata,
	Authentication,
	Source,
} from '../shared/typings/source-selector';
import { DrivelistDrive } from '../shared/drive-constraints';
import { omit } from 'lodash';

function isString(value: any): value is string {
	return typeof value === 'string';
}

async function createSource(
	selected: string,
	SourceType: Source,
	auth?: Authentication,
) {
	try {
		selected = await replaceWindowsNetworkDriveLetter(selected);
	} catch (error: any) {
		// TODO: analytics.logException(error);
	}

	if (isJson(decodeURIComponent(selected))) {
		const config: AxiosRequestConfig = JSON.parse(decodeURIComponent(selected));
		return new sourceDestination.Http({
			url: config.url!,
			axiosInstance: axios.create(omit(config, ['url'])),
		});
	}

	if (SourceType === 'File') {
		return new sourceDestination.File({
			path: selected,
		});
	}

	return new sourceDestination.Http({ url: selected, auth });
}

async function getMetadata(
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

async function getSourceMetadata(
	selected: string | DrivelistDrive,
	SourceType: Source,
	auth?: Authentication,
): Promise<SourceMetadata | Record<string, never>> {
	// `Record<string, never>` means an empty object
	if (isString(selected)) {
		const source = await createSource(selected, SourceType, auth);

		try {
			const innerSource = await source.getInnerSource();

			const metadata = await getMetadata(innerSource, selected);

			return metadata;
		} catch (error: any) {
			// TODO: handle error
			return {};
		} finally {
			await source.close();
		}
	} else {
		return {};
	}
}

export { getSourceMetadata };
