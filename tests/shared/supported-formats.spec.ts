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

import { expect } from 'chai';
import * as _ from 'lodash';

import * as supportedFormats from '../../lib/shared/supported-formats';

describe('Shared: SupportedFormats', function () {
	describe('.getCompressedExtensions()', function () {
		it('should return the supported compressed extensions', function () {
			const extensions = supportedFormats.getCompressedExtensions().sort();
			expect(extensions).to.deep.equal(['bz2', 'gz', 'xz'].sort());
		});
	});

	describe('.getNonCompressedExtensions()', function () {
		it('should return the supported non compressed extensions', function () {
			const extensions = supportedFormats.getNonCompressedExtensions();
			expect(extensions).to.deep.equal([
				'img',
				'iso',
				'bin',
				'dsk',
				'hddimg',
				'raw',
				'dmg',
				'sdcard',
				'rpi-sdimg',
				'wic',
			]);
		});
	});

	describe('.getArchiveExtensions()', function () {
		it('should return the supported archive extensions', function () {
			const extensions = supportedFormats.getArchiveExtensions();
			expect(extensions).to.deep.equal(['zip', 'etch']);
		});
	});

	describe('.getAllExtensions()', function () {
		it('should return the union of all compressed, uncompressed, and archive extensions', function () {
			const archiveExtensions = supportedFormats.getArchiveExtensions();
			const compressedExtensions = supportedFormats.getCompressedExtensions();
			const nonCompressedExtensions = supportedFormats.getNonCompressedExtensions();
			const expected = _.union(
				archiveExtensions,
				compressedExtensions,
				nonCompressedExtensions,
			).sort();
			const extensions = supportedFormats.getAllExtensions();
			expect(extensions.sort()).to.deep.equal(expected);
		});
	});

	describe('.isSupportedImage()', function () {
		_.forEach(
			[
				// Type: 'archive'
				'path/to/filename.zip',
				'path/to/filename.etch',

				// Type: 'compressed'
				'path/to/filename.img.gz',
				'path/to/filename.img.bz2',
				'path/to/filename.img.xz',

				// Type: 'image'
				'path/to/filename.img',
				'path/to/filename.iso',
				'path/to/filename.dsk',
				'path/to/filename.hddimg',
				'path/to/filename.raw',
				'path/to/filename.dmg',
				'path/to/filename.sdcard',
				'path/to/filename.wic',
			],
			(filename) => {
				it(`should return true for ${filename}`, function () {
					const isSupported = supportedFormats.isSupportedImage(filename);
					expect(isSupported).to.be.true;
				});
			},
		);

		it('should return false if the file has no extension', function () {
			const isSupported = supportedFormats.isSupportedImage('/path/to/foo');
			expect(isSupported).to.be.false;
		});

		it('should return false if the extension is not included in .getAllExtensions()', function () {
			const isSupported = supportedFormats.isSupportedImage('/path/to/foo.jpg');
			expect(isSupported).to.be.false;
		});

		it('should return true if the extension is included in .getAllExtensions()', function () {
			const nonCompressedExtension = _.first(
				supportedFormats.getNonCompressedExtensions(),
			);
			const imagePath = `/path/to/foo.${nonCompressedExtension}`;
			const isSupported = supportedFormats.isSupportedImage(imagePath);
			expect(isSupported).to.be.true;
		});

		it('should ignore casing when determining extension validity', function () {
			const nonCompressedExtension = _.first(
				supportedFormats.getNonCompressedExtensions(),
			);
			const imagePath = `/path/to/foo.${_.toUpper(nonCompressedExtension)}`;
			const isSupported = supportedFormats.isSupportedImage(imagePath);
			expect(isSupported).to.be.true;
		});

		it('should not consider an extension before a non compressed extension', function () {
			const nonCompressedExtension = _.first(
				supportedFormats.getNonCompressedExtensions(),
			);
			const imagePath = `/path/to/foo.1234.${nonCompressedExtension}`;
			const isSupported = supportedFormats.isSupportedImage(imagePath);
			expect(isSupported).to.be.true;
		});

		it('should return true if the extension is supported and the file name includes dots', function () {
			const nonCompressedExtension = _.first(
				supportedFormats.getNonCompressedExtensions(),
			);
			const imagePath = `/path/to/foo.1.2.3-bar.${nonCompressedExtension}`;
			const isSupported = supportedFormats.isSupportedImage(imagePath);
			expect(isSupported).to.be.true;
		});

		it('should return true if the extension is only a supported archive extension', function () {
			const archiveExtension = _.first(supportedFormats.getArchiveExtensions());
			const imagePath = `/path/to/foo.${archiveExtension}`;
			const isSupported = supportedFormats.isSupportedImage(imagePath);
			expect(isSupported).to.be.true;
		});

		it('should return true if the extension is a supported one plus a supported compressed extensions', function () {
			const nonCompressedExtension = _.first(
				supportedFormats.getNonCompressedExtensions(),
			);
			const compressedExtension = _.first(
				supportedFormats.getCompressedExtensions(),
			);
			const imagePath = `/path/to/foo.${nonCompressedExtension}.${compressedExtension}`;
			const isSupported = supportedFormats.isSupportedImage(imagePath);
			expect(isSupported).to.be.true;
		});

		it('should return false if the extension is an unsupported one plus a supported compressed extensions', function () {
			const compressedExtension = _.first(
				supportedFormats.getCompressedExtensions(),
			);
			const imagePath = `/path/to/foo.jpg.${compressedExtension}`;
			const isSupported = supportedFormats.isSupportedImage(imagePath);
			expect(isSupported).to.be.false;
		});

		it('should return false if the file has no extension', function () {
			const isSupported = supportedFormats.isSupportedImage('/path/to/foo');
			expect(isSupported).to.be.false;
		});

		it('should return false if the extension is not included in .getAllExtensions()', function () {
			const isSupported = supportedFormats.isSupportedImage('/path/to/foo.jpg');
			expect(isSupported).to.be.false;
		});

		it('should return true if the extension is included in .getAllExtensions()', function () {
			const nonCompressedExtension = _.first(
				supportedFormats.getNonCompressedExtensions(),
			);
			const imagePath = `/path/to/foo.${nonCompressedExtension}`;
			const isSupported = supportedFormats.isSupportedImage(imagePath);
			expect(isSupported).to.be.true;
		});

		it('should ignore casing when determining extension validity', function () {
			const nonCompressedExtension = _.first(
				supportedFormats.getNonCompressedExtensions(),
			);
			const imagePath = `/path/to/foo.${_.toUpper(nonCompressedExtension)}`;
			const isSupported = supportedFormats.isSupportedImage(imagePath);
			expect(isSupported).to.be.true;
		});

		it('should not consider an extension before a non compressed extension', function () {
			const nonCompressedExtension = _.first(
				supportedFormats.getNonCompressedExtensions(),
			);
			const imagePath = `/path/to/foo.1234.${nonCompressedExtension}`;
			const isSupported = supportedFormats.isSupportedImage(imagePath);
			expect(isSupported).to.be.true;
		});

		it('should return true if the extension is supported and the file name includes dots', function () {
			const nonCompressedExtension = _.first(
				supportedFormats.getNonCompressedExtensions(),
			);
			const imagePath = `/path/to/foo.1.2.3-bar.${nonCompressedExtension}`;
			const isSupported = supportedFormats.isSupportedImage(imagePath);
			expect(isSupported).to.be.true;
		});

		it('should return true if the extension is only a supported archive extension', function () {
			const archiveExtension = _.first(supportedFormats.getArchiveExtensions());
			const imagePath = `/path/to/foo.${archiveExtension}`;
			const isSupported = supportedFormats.isSupportedImage(imagePath);
			expect(isSupported).to.be.true;
		});

		it('should return true if the extension is a supported one plus a supported compressed extensions', function () {
			const nonCompressedExtension = _.first(
				supportedFormats.getNonCompressedExtensions(),
			);
			const compressedExtension = _.first(
				supportedFormats.getCompressedExtensions(),
			);
			const imagePath = `/path/to/foo.${nonCompressedExtension}.${compressedExtension}`;
			const isSupported = supportedFormats.isSupportedImage(imagePath);
			expect(isSupported).to.be.true;
		});

		it('should return false if the extension is an unsupported one plus a supported compressed extensions', function () {
			const compressedExtension = _.first(
				supportedFormats.getCompressedExtensions(),
			);
			const imagePath = `/path/to/foo.jpg.${compressedExtension}`;
			const isSupported = supportedFormats.isSupportedImage(imagePath);
			expect(isSupported).to.be.false;
		});
	});

	describe('.looksLikeWindowsImage()', function () {
		_.each(
			[
				'C:\\path\\to\\en_windows_10_multiple_editions_version_1607_updated_jan_2017_x64_dvd_9714399.iso',
				'/path/to/en_windows_10_multiple_editions_version_1607_updated_jan_2017_x64_dvd_9714399.iso',
				'/path/to/Win10_1607_SingleLang_English_x32.iso',
				'/path/to/en_winxp_pro_x86_build2600_iso.img',
			],
			(imagePath) => {
				it(`should return true if filename is ${imagePath}`, function () {
					const looksLikeWindowsImage = supportedFormats.looksLikeWindowsImage(
						imagePath,
					);
					expect(looksLikeWindowsImage).to.be.true;
				});
			},
		);

		_.each(
			[
				'C:\\path\\to\\2017-01-11-raspbian-jessie.img',
				'/path/to/2017-01-11-raspbian-jessie.img',
			],
			(imagePath) => {
				it(`should return false if filename is ${imagePath}`, function () {
					const looksLikeWindowsImage = supportedFormats.looksLikeWindowsImage(
						imagePath,
					);
					expect(looksLikeWindowsImage).to.be.false;
				});
			},
		);
	});
});
