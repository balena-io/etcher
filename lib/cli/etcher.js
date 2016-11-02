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
const options = require('./cli');
const EXIT_CODES = require('../src/exit-codes');

form.run([
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

    // If `options.yes` is `false`, pass `undefined`,
    // otherwise the question will not be asked because
    // `false` is a defined value.
    yes: options.robot || options.yes || undefined

  }
}).then((answers) => {
  if (!answers.yes) {
    throw new Error('Aborted');
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
      throw new Error(`Drive not found: ${answers.drive}`);
    }

    return writer.writeImage(options._[0], selectedDrive, {
      unmountOnSuccess: options.unmount,
      validateWriteOnSuccess: options.check
    }, (state) => {

      if (options.robot) {
        console.log(JSON.stringify({
          command: 'progress',
          data: {
            type: state.type,
            percentage: Math.floor(state.percentage),
            eta: state.eta,
            speed: Math.floor(state.speed)
          }
        }));
      } else {
        progressBars[state.type].update(state);
      }

    });
  });
}).then((results) => {

  return Bluebird.try(() => {
    if (options.robot) {
      return console.log(JSON.stringify({
        command: 'done',
        data: {
          sourceChecksum: results.sourceChecksum
        }
      }));
    }

    console.log('Your flash is complete!');

    if (results.sourceChecksum) {
      console.log(`Checksum: ${results.sourceChecksum}`);
    }

  }).then(() => {
    process.exit(EXIT_CODES.SUCCESS);
  });

}).catch((error) => {

  return Bluebird.try(() => {
    if (options.robot) {
      return console.error(JSON.stringify({
        command: 'error',
        data: {
          message: error.message,
          description: error.description,
          stacktrace: error.stack,
          code: error.code
        }
      }));
    }

    utils.printError(error);
  }).then(() => {
    if (error.code === 'EVALIDATION') {
      process.exit(EXIT_CODES.VALIDATION_ERROR);
    }

    process.exit(EXIT_CODES.GENERAL_ERROR);
  });

});
