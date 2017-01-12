/*
 * Copyright 2016 resin.io
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

'use strict';

const chalk = require('chalk');
const inquirer = require('inquirer');
const _ = require('lodash');

const DynamicList = require('./dynamic-list');
const scanner = require('./drive-scanner');
const driveComparer = require('../shared/utils').driveComparer;
const constraints = require('../shared/drive-constraints');

inquirer.registerPrompt('dynamicList', DynamicList);

const driveToChoiceFn = (image) => {

  /**
   * Map a drive object to a `inquirer` choice object
   * @param {object} drive - Drive object as returned by `drivelist`
   * @private
   * @returns {{name: string, value: object}}
   */
  const driveToChoice = (drive) => {
    const size = drive.size / 1000000000;

    const driveInfo = `${drive.device} (${size.toFixed(1)} GB) - ${drive.description}`;

    const systemDriveText = chalk.red(constraints.labels.SYSTEM_DRIVE);
    const systemDriveDisplay = constraints.isSystemDrive(drive) ? systemDriveText : '';

    const notRecommendedSizeText = chalk.yellow(constraints.labels.NOT_RECOMMENDED);
    const recommendedSizeDisplay = constraints.isDriveSizeRecommended(drive, image) ? '' : notRecommendedSizeText;

    const displayName = `${driveInfo} ${systemDriveDisplay} ${recommendedSizeDisplay}`;

    const choice = {
      name: displayName,
      value: drive
    };

    if (!constraints.isDriveLargeEnough(drive, image)) {
      choice.disabled = constraints.labels.TOO_SMALL;
    }

    if (constraints.isDriveLocked(drive)) {
      choice.disabled = constraints.labels.LOCKED;
    }

    return choice;
  };

  return driveToChoice;
};

module.exports = function(initialDrives, confirmationRequired, image) {

  /**
   * Returns true iff `inquirer` should prompt in the case of a fixed drive selected
   * @param {object} answers - The answers given so far
   * @returns {boolean}
   */
  const confirmWriteToFixedDrive = (answers) => {
    if (!confirmationRequired || !answers.yes) {
      return false;
    }
    return constraints.isSystemDrive(answers.drive);
  };

  /**
   * Returns true iff `inquirer` should prompt in the case a drive selected not meeting the
   * minimum recommended size requirement is chosen
   *
   * @param {object} answers - The answers given so far
   * @returns {boolean}
   */
  const confirmWriteToNotRecommendedDrive = (answers) => {
    if (!confirmationRequired || !answers.yes) {
      return false;
    }
    return !constraints.isDriveSizeRecommended(answers.drive, image);
  };

  initialDrives.sort(driveComparer);

  return inquirer.prompt([ {
    message: 'Select drive',
    type: 'dynamicList',
    name: 'drive',
    choices: initialDrives.map(driveToChoiceFn(image)),
    emitter: scanner,
    mapFn: driveToChoiceFn(image),
    sort: true,
    compareFn: (choice1, choice2) => {
      return driveComparer(choice1.value, choice2.value);
    }
  }, {
    message: 'This will erase the selected drive. Are you sure?',
    type: 'confirm',
    name: 'yes',
    default: false,
    when: _.constant(confirmationRequired)
  }, {
    message: `You have selected a ${chalk.red('NON REMOVABLE DRIVE')}. Do you want to continue?`,
    type: 'confirm',
    name: 'yes',
    default: false,
    when: confirmWriteToFixedDrive
  }, {
    message: (answers) => {
      return constraints.labels.unrecommendedSizeWarningText(answers.drive, image);
    },
    type: 'confirm',
    name: 'yes',
    default: false,
    when: confirmWriteToNotRecommendedDrive
  } ]).then((answers) => {

    if (confirmationRequired && !answers.yes) {
      throw new Error('Abort');
    }

    return answers.drive;
  });

};
