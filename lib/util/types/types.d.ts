import { Metadata } from 'etcher-sdk/build/source-destination';
import { SourceMetadata } from '../../shared/typings/source-selector';
import { Drive as DrivelistDrive } from 'drivelist';

export interface WriteResult {
	bytesWritten?: number;
	devices?: {
		failed: number;
		successful: number;
	};
	errors: FlashError[];
	sourceMetadata?: Metadata;
}

export interface FlashError extends Error {
	description: string;
	device: string;
	code: string;
}

export interface FlashResults extends WriteResult {
	skip?: boolean;
	cancelled?: boolean;
}

interface WriteOptions {
	image: SourceMetadata;
	destinations: DrivelistDrive[];
	autoBlockmapping: boolean;
	decompressFirst: boolean;
	SourceType: string;
	httpRequest?: any;
}
