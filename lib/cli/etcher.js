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

const _ = require('lodash');
const Bluebird = require('bluebird');
const visuals = require('resin-cli-visuals');
const form = require('resin-cli-form');
const drivelist = Bluebird.promisifyAll(require('drivelist'));
const writer = require('./writer');
const utils = require('./utils');
const options = require('./options');
const robot = require('../shared/robot');
const messages = require('../shared/messages');
const EXIT_CODES = require('../shared/exit-codes');
const errors = require('../shared/errors');
const permissions = require('../shared/permissions');

const ARGV_IMAGE_PATH_INDEX = 0;
const imagePath = options._[ARGV_IMAGE_PATH_INDEX];

permissions.isElevated().then((elevated) => {
  if (!elevated) {
    throw errors.createUserError(
      messages.error.elevationRequired(),
      'This tool requires special permissions to write to external drives'
    );
  }

  return form.run([
    {
      message: 'Select drive',
      type: 'drive',
      name: 'drive'
    },
    {
      message: 'This will erase the selected drive. Are you sure?',
      type: 'confirm',
      name: 'yes',
      default: false
    }
  ], {
    override: {
      drive: options.drive,

      // If `options.yes` is `false`, pass `null`,
      // otherwise the question will not be asked because
      // `false` is a defined value.
      yes: robot.isEnabled(process.env) || options.yes || null

    }
  });
}).then((answers) => {
  if (!answers.yes) {
    throw errors.createUserError('Aborted', 'We can\'t proceed without confirmation');
  }

  const progressBars = {
    write: new visuals.Progress('Flashing'),
    check: new visuals.Progress('Validating')
  };

  return drivelist.listAsync().then((drives) => {
    const selectedDrive = _.find(drives, {
      device: answers.drive
    });

    if (!selectedDrive) {
      throw errors.createUserError(
        'The selected drive was not found',
        `We can't find ${answers.drive} in your system. Did you unplug the drive?`
      );
    }

    return writer.writeImage(imagePath, selectedDrive, {
      unmountOnSuccess: options.unmount,
      validateWriteOnSuccess: options.check
    }, (state) => {

      if (robot.isEnabled(process.env)) {
        robot.printMessage('progress', {
          type: state.type,
          percentage: Math.floor(state.percentage),
          eta: state.eta,
          speed: Math.floor(state.speed)
        });
      } else {
        progressBars[state.type].update(state);
      }

    });
  });
}).then((results) => {

  return Bluebird.try(() => {
    if (robot.isEnabled(process.env)) {
      return robot.printMessage('done', {
        sourceChecksum: results.sourceChecksum
      });
    }

    console.log(messages.info.flashComplete());

    if (results.sourceChecksum) {
      console.log(`Checksum: ${results.sourceChecksum}`);
    }

    return Bluebird.resolve();
  }).then(() => {
    process.exit(EXIT_CODES.SUCCESS);
  });

}).catch((error) => {

  return Bluebird.try(() => {
    if (robot.isEnabled(process.env)) {
      return robot.printError(error);
    }

    utils.printError(error);
    return Bluebird.resolve();
  }).then(() => {
    if (error.code === 'EVALIDATION') {
      process.exit(EXIT_CODES.VALIDATION_ERROR);
    }

    process.exit(EXIT_CODES.GENERAL_ERROR);
  });

});
