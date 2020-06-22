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
import * as path from 'path';

import * as availableDrives from '../../../lib/gui/app/models/available-drives';
import * as selectionState from '../../../lib/gui/app/models/selection-state';

describe('Model: selectionState', function () {
	describe('given a clean state', function () {
		beforeEach(function () {
			selectionState.clear();
		});

		it('getImage() should return undefined', function () {
			expect(selectionState.getImage()).to.be.undefined;
		});

		it('getImagePath() should return undefined', function () {
			expect(selectionState.getImagePath()).to.be.undefined;
		});

		it('getImageSize() should return undefined', function () {
			expect(selectionState.getImageSize()).to.be.undefined;
		});

		it('getImageUrl() should return undefined', function () {
			expect(selectionState.getImageUrl()).to.be.undefined;
		});

		it('getImageName() should return undefined', function () {
			expect(selectionState.getImageName()).to.be.undefined;
		});

		it('getImageLogo() should return undefined', function () {
			expect(selectionState.getImageLogo()).to.be.undefined;
		});

		it('getImageSupportUrl() should return undefined', function () {
			expect(selectionState.getImageSupportUrl()).to.be.undefined;
		});

		it('getImageRecommendedDriveSize() should return undefined', function () {
			expect(selectionState.getImageRecommendedDriveSize()).to.be.undefined;
		});

		it('hasDrive() should return false', function () {
			const hasDrive = selectionState.hasDrive();
			expect(hasDrive).to.be.false;
		});

		it('hasImage() should return false', function () {
			const hasImage = selectionState.hasImage();
			expect(hasImage).to.be.false;
		});

		it('.getSelectedDrives() should return []', function () {
			expect(selectionState.getSelectedDrives()).to.deep.equal([]);
		});
	});

	describe('given one available drive', function () {
		beforeEach(function () {
			this.drives = [
				{
					device: '/dev/disk2',
					name: 'USB Drive',
					size: 999999999,
					isReadOnly: false,
				},
			];
		});

		afterEach(function () {
			selectionState.clear();
			availableDrives.setDrives([]);
		});

		describe('.selectDrive()', function () {
			it('should not deselect when warning is attached to image-drive pair', function () {
				this.drives[0].size = 64e10;

				availableDrives.setDrives(this.drives);
				selectionState.selectDrive('/dev/disk2');
				availableDrives.setDrives(this.drives);
				expect(selectionState.getSelectedDevices()[0]).to.equal('/dev/disk2');
			});
		});
	});

	describe('given a drive', function () {
		beforeEach(function () {
			availableDrives.setDrives([
				{
					device: '/dev/disk2',
					name: 'USB Drive',
					size: 999999999,
					isReadOnly: false,
				},
				{
					device: '/dev/disk5',
					name: 'USB Drive',
					size: 999999999,
					isReadOnly: false,
				},
			]);

			selectionState.selectDrive('/dev/disk2');
		});

		afterEach(function () {
			selectionState.clear();
		});

		describe('.hasDrive()', function () {
			it('should return true', function () {
				const hasDrive = selectionState.hasDrive();
				expect(hasDrive).to.be.true;
			});
		});

		describe('.selectDrive()', function () {
			it('should queue the drive', function () {
				selectionState.selectDrive('/dev/disk5');
				const drives = selectionState.getSelectedDevices();
				const lastDriveDevice = _.last(drives);
				const lastDrive = _.find(availableDrives.getDrives(), {
					device: lastDriveDevice,
				});
				expect(lastDrive).to.deep.equal({
					device: '/dev/disk5',
					name: 'USB Drive',
					size: 999999999,
					isReadOnly: false,
				});
			});
		});

		describe('.deselectDrive()', function () {
			it('should clear drive', function () {
				const firstDevice = selectionState.getSelectedDevices()[0];
				selectionState.deselectDrive(firstDevice);
				const devices = selectionState.getSelectedDevices();
				expect(devices.length).to.equal(0);
			});
		});

		describe('.getSelectedDrives()', function () {
			it('should return that single selected drive', function () {
				expect(selectionState.getSelectedDrives()).to.deep.equal([
					{
						device: '/dev/disk2',
						name: 'USB Drive',
						size: 999999999,
						isReadOnly: false,
					},
				]);
			});
		});
	});

	describe('given several drives', function () {
		beforeEach(function () {
			this.drives = [
				{
					device: '/dev/sdb',
					description: 'DataTraveler 2.0',
					size: 999999999,
					mountpoint: '/media/UNTITLED',
					name: '/dev/sdb',
					system: false,
					isReadOnly: false,
				},
				{
					device: '/dev/disk2',
					name: 'USB Drive 2',
					size: 999999999,
					isReadOnly: false,
				},
				{
					device: '/dev/disk3',
					name: 'USB Drive 3',
					size: 999999999,
					isReadOnly: false,
				},
			];

			availableDrives.setDrives(this.drives);

			selectionState.selectDrive(this.drives[0].device);
			selectionState.selectDrive(this.drives[1].device);
		});

		afterEach(function () {
			selectionState.clear();
			availableDrives.setDrives([]);
		});

		it('should be able to add more drives', function () {
			selectionState.selectDrive(this.drives[2].device);
			expect(selectionState.getSelectedDevices()).to.deep.equal(
				_.map(this.drives, 'device'),
			);
		});

		it('should be able to remove drives', function () {
			selectionState.deselectDrive(this.drives[1].device);
			expect(selectionState.getSelectedDevices()).to.deep.equal([
				this.drives[0].device,
			]);
		});

		it('should keep system drives selected', function () {
			const systemDrive = {
				device: '/dev/disk0',
				name: 'USB Drive 0',
				size: 999999999,
				isReadOnly: false,
				system: true,
			};

			const newDrives = [..._.initial(this.drives), systemDrive];
			availableDrives.setDrives(newDrives);

			selectionState.selectDrive(systemDrive.device);
			availableDrives.setDrives(newDrives);
			expect(selectionState.getSelectedDevices()).to.deep.equal(
				_.map(newDrives, 'device'),
			);
		});

		it('should be able to remove a drive', function () {
			expect(selectionState.getSelectedDevices().length).to.equal(2);
			selectionState.toggleDrive(this.drives[0].device);
			expect(selectionState.getSelectedDevices()).to.deep.equal([
				this.drives[1].device,
			]);
		});

		describe('.deselectAllDrives()', function () {
			it('should remove all drives', function () {
				selectionState.deselectAllDrives();
				expect(selectionState.getSelectedDevices()).to.deep.equal([]);
			});
		});

		describe('.deselectDrive()', function () {
			it('should clear drives', function () {
				const devices = selectionState.getSelectedDevices();
				selectionState.deselectDrive(devices[0]);
				selectionState.deselectDrive(devices[1]);
				expect(selectionState.getSelectedDevices().length).to.equal(0);
			});
		});

		describe('.getSelectedDrives()', function () {
			it('should return the selected drives', function () {
				expect(selectionState.getSelectedDrives()).to.deep.equal([
					{
						device: '/dev/sdb',
						description: 'DataTraveler 2.0',
						size: 999999999,
						mountpoint: '/media/UNTITLED',
						name: '/dev/sdb',
						system: false,
						isReadOnly: false,
					},
					{
						device: '/dev/disk2',
						name: 'USB Drive 2',
						size: 999999999,
						isReadOnly: false,
					},
				]);
			});
		});
	});

	describe('given no drive', function () {
		describe('.selectDrive()', function () {
			it('should be able to set a drive', function () {
				availableDrives.setDrives([
					{
						device: '/dev/disk5',
						name: 'USB Drive',
						size: 999999999,
						isReadOnly: false,
					},
				]);

				selectionState.selectDrive('/dev/disk5');
				expect(selectionState.getSelectedDevices()[0]).to.equal('/dev/disk5');
			});

			it('should throw if drive is read-only', function () {
				availableDrives.setDrives([
					{
						device: '/dev/disk1',
						name: 'USB Drive',
						size: 999999999,
						isReadOnly: true,
					},
				]);

				expect(function () {
					selectionState.selectDrive('/dev/disk1');
				}).to.throw('The drive is write-protected');
			});

			it('should throw if the drive is not available', function () {
				availableDrives.setDrives([
					{
						device: '/dev/disk1',
						name: 'USB Drive',
						size: 999999999,
						isReadOnly: true,
					},
				]);

				expect(function () {
					selectionState.selectDrive('/dev/disk5');
				}).to.throw('The drive is not available: /dev/disk5');
			});

			it('should throw if device is not a string', function () {
				expect(function () {
					// @ts-ignore
					selectionState.selectDrive(123);
				}).to.throw('Invalid drive: 123');
			});
		});
	});

	describe('given an image', function () {
		beforeEach(function () {
			this.image = {
				path: 'foo.img',
				extension: 'img',
				size: 999999999,
				recommendedDriveSize: 1000000000,
				url: 'https://www.raspbian.org',
				supportUrl: 'https://www.raspbian.org/forums/',
				name: 'Raspbian',
				logo: '<svg><text fill="red">Raspbian</text></svg>',
			};

			selectionState.selectSource(this.image);
		});

		describe('.selectDrive()', function () {
			it('should throw if drive is not large enough', function () {
				availableDrives.setDrives([
					{
						device: '/dev/disk2',
						name: 'USB Drive',
						size: 999999998,
						isReadOnly: false,
					},
				]);

				expect(function () {
					selectionState.selectDrive('/dev/disk2');
				}).to.throw('The drive is not large enough');
			});
		});

		describe('.getImage()', function () {
			it('should return the image', function () {
				expect(selectionState.getImage()).to.deep.equal(this.image);
			});
		});

		describe('.getImagePath()', function () {
			it('should return the image path', function () {
				const imagePath = selectionState.getImagePath();
				expect(imagePath).to.equal('foo.img');
			});
		});

		describe('.getImageSize()', function () {
			it('should return the image size', function () {
				const imageSize = selectionState.getImageSize();
				expect(imageSize).to.equal(999999999);
			});
		});

		describe('.getImageUrl()', function () {
			it('should return the image url', function () {
				const imageUrl = selectionState.getImageUrl();
				expect(imageUrl).to.equal('https://www.raspbian.org');
			});
		});

		describe('.getImageName()', function () {
			it('should return the image name', function () {
				const imageName = selectionState.getImageName();
				expect(imageName).to.equal('Raspbian');
			});
		});

		describe('.getImageLogo()', function () {
			it('should return the image logo', function () {
				const imageLogo = selectionState.getImageLogo();
				expect(imageLogo).to.equal(
					'<svg><text fill="red">Raspbian</text></svg>',
				);
			});
		});

		describe('.getImageSupportUrl()', function () {
			it('should return the image support url', function () {
				const imageSupportUrl = selectionState.getImageSupportUrl();
				expect(imageSupportUrl).to.equal('https://www.raspbian.org/forums/');
			});
		});

		describe('.getImageRecommendedDriveSize()', function () {
			it('should return the image recommended drive size', function () {
				const imageRecommendedDriveSize = selectionState.getImageRecommendedDriveSize();
				expect(imageRecommendedDriveSize).to.equal(1000000000);
			});
		});

		describe('.hasImage()', function () {
			it('should return true', function () {
				const hasImage = selectionState.hasImage();
				expect(hasImage).to.be.true;
			});
		});

		describe('.selectImage()', function () {
			it('should override the image', function () {
				selectionState.selectSource({
					path: 'bar.img',
					extension: 'img',
					size: 999999999,
					isSizeEstimated: false,
				});

				const imagePath = selectionState.getImagePath();
				expect(imagePath).to.equal('bar.img');
				const imageSize = selectionState.getImageSize();
				expect(imageSize).to.equal(999999999);
			});
		});

		describe('.deselectImage()', function () {
			it('should clear the image', function () {
				selectionState.deselectImage();

				const imagePath = selectionState.getImagePath();
				expect(imagePath).to.be.undefined;
				const imageSize = selectionState.getImageSize();
				expect(imageSize).to.be.undefined;
			});
		});
	});

	describe('given no image', function () {
		describe('.selectImage()', function () {
			afterEach(selectionState.clear);

			it('should be able to set an image', function () {
				selectionState.selectSource({
					path: 'foo.img',
					extension: 'img',
					size: 999999999,
					isSizeEstimated: false,
				});

				const imagePath = selectionState.getImagePath();
				expect(imagePath).to.equal('foo.img');
				const imageSize = selectionState.getImageSize();
				expect(imageSize).to.equal(999999999);
			});

			it('should be able to set an image with an archive extension', function () {
				selectionState.selectSource({
					path: 'foo.zip',
					extension: 'img',
					archiveExtension: 'zip',
					size: 999999999,
					isSizeEstimated: false,
				});

				const imagePath = selectionState.getImagePath();
				expect(imagePath).to.equal('foo.zip');
			});

			it('should infer a compressed raw image if the penultimate extension is missing', function () {
				selectionState.selectSource({
					path: 'foo.xz',
					extension: 'img',
					archiveExtension: 'xz',
					size: 999999999,
					isSizeEstimated: false,
				});

				const imagePath = selectionState.getImagePath();
				expect(imagePath).to.equal('foo.xz');
			});

			it('should infer a compressed raw image if the penultimate extension is not a file extension', function () {
				selectionState.selectSource({
					path: 'something.linux-x86-64.gz',
					extension: 'img',
					archiveExtension: 'gz',
					size: 999999999,
					isSizeEstimated: false,
				});

				const imagePath = selectionState.getImagePath();
				expect(imagePath).to.equal('something.linux-x86-64.gz');
			});

			it('should throw if no path', function () {
				expect(function () {
					selectionState.selectSource({
						extension: 'img',
						size: 999999999,
						isSizeEstimated: false,
					});
				}).to.throw('Missing image fields: path');
			});

			it('should throw if path is not a string', function () {
				expect(function () {
					selectionState.selectSource({
						path: 123,
						extension: 'img',
						size: 999999999,
						isSizeEstimated: false,
					});
				}).to.throw('Invalid image path: 123');
			});

			it('should throw if the original size is not a number', function () {
				expect(function () {
					selectionState.selectSource({
						path: 'foo.img',
						extension: 'img',
						size: 999999999,
						compressedSize: '999999999',
						isSizeEstimated: false,
					});
				}).to.throw('Invalid image compressed size: 999999999');
			});

			it('should throw if the original size is a float number', function () {
				expect(function () {
					selectionState.selectSource({
						path: 'foo.img',
						extension: 'img',
						size: 999999999,
						compressedSize: 999999999.999,
						isSizeEstimated: false,
					});
				}).to.throw('Invalid image compressed size: 999999999.999');
			});

			it('should throw if the original size is negative', function () {
				expect(function () {
					selectionState.selectSource({
						path: 'foo.img',
						extension: 'img',
						size: 999999999,
						compressedSize: -1,
						isSizeEstimated: false,
					});
				}).to.throw('Invalid image compressed size: -1');
			});

			it('should throw if the final size is not a number', function () {
				expect(function () {
					selectionState.selectSource({
						path: 'foo.img',
						extension: 'img',
						size: '999999999',
						isSizeEstimated: false,
					});
				}).to.throw('Invalid image size: 999999999');
			});

			it('should throw if the final size is a float number', function () {
				expect(function () {
					selectionState.selectSource({
						path: 'foo.img',
						extension: 'img',
						size: 999999999.999,
						isSizeEstimated: false,
					});
				}).to.throw('Invalid image size: 999999999.999');
			});

			it('should throw if the final size is negative', function () {
				expect(function () {
					selectionState.selectSource({
						path: 'foo.img',
						extension: 'img',
						size: -1,
						isSizeEstimated: false,
					});
				}).to.throw('Invalid image size: -1');
			});

			it("should throw if url is defined but it's not a string", function () {
				expect(function () {
					selectionState.selectSource({
						path: 'foo.img',
						extension: 'img',
						size: 999999999,
						isSizeEstimated: false,
						url: 1234,
					});
				}).to.throw('Invalid image url: 1234');
			});

			it("should throw if name is defined but it's not a string", function () {
				expect(function () {
					selectionState.selectSource({
						path: 'foo.img',
						extension: 'img',
						size: 999999999,
						isSizeEstimated: false,
						name: 1234,
					});
				}).to.throw('Invalid image name: 1234');
			});

			it("should throw if logo is defined but it's not a string", function () {
				expect(function () {
					selectionState.selectSource({
						path: 'foo.img',
						extension: 'img',
						size: 999999999,
						isSizeEstimated: false,
						logo: 1234,
					});
				}).to.throw('Invalid image logo: 1234');
			});

			it('should de-select a previously selected not-large-enough drive', function () {
				availableDrives.setDrives([
					{
						device: '/dev/disk1',
						name: 'USB Drive',
						size: 123456789,
						isReadOnly: false,
					},
				]);

				selectionState.selectDrive('/dev/disk1');
				expect(selectionState.hasDrive()).to.be.true;

				selectionState.selectSource({
					path: 'foo.img',
					extension: 'img',
					size: 1234567890,
					isSizeEstimated: false,
				});

				expect(selectionState.hasDrive()).to.be.false;
				selectionState.deselectImage();
			});

			it('should de-select a previously selected not-recommended drive', function () {
				availableDrives.setDrives([
					{
						device: '/dev/disk1',
						name: 'USB Drive',
						size: 1200000000,
						isReadOnly: false,
					},
				]);

				selectionState.selectDrive('/dev/disk1');
				expect(selectionState.hasDrive()).to.be.true;

				selectionState.selectSource({
					path: 'foo.img',
					extension: 'img',
					size: 999999999,
					isSizeEstimated: false,
					recommendedDriveSize: 1500000000,
				});

				expect(selectionState.hasDrive()).to.be.false;
				selectionState.deselectImage();
			});

			it('should de-select a previously selected source drive', function () {
				const imagePath =
					process.platform === 'win32'
						? 'E:\\bar\\foo.img'
						: '/mnt/bar/foo.img';

				availableDrives.setDrives([
					{
						device: '/dev/disk1',
						name: 'USB Drive',
						size: 1200000000,
						mountpoints: [
							{
								path: path.dirname(imagePath),
							},
						],
						isReadOnly: false,
					},
				]);

				selectionState.selectDrive('/dev/disk1');
				expect(selectionState.hasDrive()).to.be.true;

				selectionState.selectSource({
					path: imagePath,
					extension: 'img',
					size: 999999999,
					isSizeEstimated: false,
				});

				expect(selectionState.hasDrive()).to.be.false;
				selectionState.deselectImage();
			});
		});
	});

	describe('given a drive and an image', function () {
		beforeEach(function () {
			availableDrives.setDrives([
				{
					device: '/dev/disk1',
					name: 'USB Drive',
					size: 999999999,
					isReadOnly: false,
				},
			]);

			selectionState.selectDrive('/dev/disk1');

			selectionState.selectSource({
				path: 'foo.img',
				extension: 'img',
				size: 999999999,
				isSizeEstimated: false,
			});
		});

		describe('.clear()', function () {
			it('should clear all selections', function () {
				expect(selectionState.hasDrive()).to.be.true;
				expect(selectionState.hasImage()).to.be.true;

				selectionState.clear();

				expect(selectionState.hasDrive()).to.be.false;
				expect(selectionState.hasImage()).to.be.false;
			});
		});

		describe('.deselectImage()', function () {
			beforeEach(function () {
				selectionState.deselectImage();
			});

			it('getImagePath() should return undefined', function () {
				const imagePath = selectionState.getImagePath();
				expect(imagePath).to.be.undefined;
			});

			it('getImageSize() should return undefined', function () {
				const imageSize = selectionState.getImageSize();
				expect(imageSize).to.be.undefined;
			});

			it('should not clear any drives', function () {
				expect(selectionState.hasDrive()).to.be.true;
			});

			it('hasImage() should return false', function () {
				const hasImage = selectionState.hasImage();
				expect(hasImage).to.be.false;
			});
		});

		describe('.deselectAllDrives()', function () {
			beforeEach(function () {
				selectionState.deselectAllDrives();
			});

			it('getImagePath() should return the image path', function () {
				const imagePath = selectionState.getImagePath();
				expect(imagePath).to.equal('foo.img');
			});

			it('getImageSize() should return the image size', function () {
				const imageSize = selectionState.getImageSize();
				expect(imageSize).to.equal(999999999);
			});

			it('hasDrive() should return false', function () {
				const hasDrive = selectionState.hasDrive();
				expect(hasDrive).to.be.false;
			});

			it('should not clear the image', function () {
				expect(selectionState.hasImage()).to.be.true;
			});
		});
	});

	describe('given several drives', function () {
		beforeEach(function () {
			availableDrives.setDrives([
				{
					device: '/dev/disk1',
					name: 'USB Drive 1',
					size: 999999999,
					isReadOnly: false,
				},
				{
					device: '/dev/disk2',
					name: 'USB Drive 2',
					size: 999999999,
					isReadOnly: false,
				},
				{
					device: '/dev/disk3',
					name: 'USB Drive 3',
					size: 999999999,
					isReadOnly: false,
				},
			]);

			selectionState.selectDrive('/dev/disk1');
			selectionState.selectDrive('/dev/disk2');
			selectionState.selectDrive('/dev/disk3');

			selectionState.selectSource({
				path: 'foo.img',
				extension: 'img',
				size: 999999999,
				isSizeEstimated: false,
			});
		});

		describe('.clear()', function () {
			it('should clear all selections', function () {
				expect(selectionState.hasDrive()).to.be.true;
				expect(selectionState.hasImage()).to.be.true;

				selectionState.clear();

				expect(selectionState.hasDrive()).to.be.false;
				expect(selectionState.hasImage()).to.be.false;
			});
		});
	});

	describe('.toggleDrive()', function () {
		describe('given a selected drive', function () {
			beforeEach(function () {
				this.drive = {
					device: '/dev/sdb',
					description: 'DataTraveler 2.0',
					size: 999999999,
					mountpoints: [
						{
							path: '/media/UNTITLED',
						},
					],
					name: '/dev/sdb',
					isSystem: false,
					isReadOnly: false,
				};

				availableDrives.setDrives([
					this.drive,
					{
						device: '/dev/disk2',
						name: 'USB Drive 2',
						size: 999999999,
						isReadOnly: false,
					},
				]);

				selectionState.selectDrive(this.drive.device);
			});

			afterEach(function () {
				selectionState.clear();
				availableDrives.setDrives([]);
			});

			it('should be able to remove the drive', function () {
				expect(selectionState.hasDrive()).to.be.true;
				selectionState.toggleDrive(this.drive.device);
				expect(selectionState.hasDrive()).to.be.false;
			});

			it('should not replace a different drive', function () {
				const drive = {
					device: '/dev/disk2',
					name: 'USB Drive',
					size: 999999999,
					isReadOnly: false,
				};

				expect(selectionState.getSelectedDevices()[0]).to.deep.equal(
					this.drive.device,
				);
				selectionState.toggleDrive(drive.device);
				expect(selectionState.getSelectedDevices()[0]).to.deep.equal(
					this.drive.device,
				);
			});
		});

		describe('given no selected drive', function () {
			beforeEach(function () {
				selectionState.clear();

				availableDrives.setDrives([
					{
						device: '/dev/disk2',
						name: 'USB Drive 2',
						size: 999999999,
						isReadOnly: false,
					},
					{
						device: '/dev/disk3',
						name: 'USB Drive 3',
						size: 999999999,
						isReadOnly: false,
					},
				]);
			});

			afterEach(function () {
				availableDrives.setDrives([]);
			});

			it('should set the drive', function () {
				const drive = {
					device: '/dev/disk2',
					name: 'USB Drive 2',
					size: 999999999,
					isReadOnly: false,
				};

				expect(selectionState.hasDrive()).to.be.false;
				selectionState.toggleDrive(drive.device);
				expect(selectionState.getSelectedDevices()[0]).to.equal('/dev/disk2');
			});
		});
	});
});
