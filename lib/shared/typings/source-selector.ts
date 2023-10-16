import { GPTPartition, MBRPartition } from 'partitioninfo';
import { sourceDestination } from 'etcher-sdk';
import { DrivelistDrive } from '../drive-constraints';

export type Source = 'File' | 'BlockDevice' | 'Http';

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

export interface Authentication {
	username: string;
	password: string;
}
