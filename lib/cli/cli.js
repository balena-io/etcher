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
const fs = require('fs');
const yargs = require('yargs');
const utils = require('./utils');
const EXIT_CODES = require('../shared/exit-codes');
const packageJSON = require('../../package.json');

/**
 * @summary Parsed CLI options and arguments
 * @type Object
 * @public
 */
module.exports = yargs

  // Don't wrap at all
  .wrap(null)

  .demand(1, 'Missing image')

  // Usage help
  .usage('Usage: $0 [options] <image>')
  .epilogue([
    'Exit codes:',
    _.map(EXIT_CODES, (value, key) => {
      const reason = _.map(_.split(key, '_'), _.capitalize).join(' ');
      return '  ' + value + ' - ' + reason;
    }).join('\n'),
    '',
    'If you need help, don\'t hesitate in contacting us at:',
    '',
    '  GitHub: https://github.com/resin-io/etcher/issues/new',
    '  Gitter: https://gitter.im/resin-io/etcher'
  ].join('\n'))

  // Examples
  .example('$0 raspberry-pi.img')
  .example('$0 --no-check raspberry-pi.img')
  .example('$0 -d /dev/disk2 ubuntu.iso')
  .example('$0 -d /dev/disk2 -y rpi.img')

  // Help option
  .help()

  // Version option
  .version(_.constant(packageJSON.version))

  // Error reporting
  .fail((message, error) => {
    yargs.showHelp();
    utils.printError(error || message);
    process.exit(1);
  })

  // Assert that image exists
  .check((argv) => {
    fs.accessSync(argv._[0]);
    return true;
  })

  .check((argv) => {
    if (argv.robot && !argv.drive) {
      throw new Error('Missing drive');
    }

    return true;
  })

  .options({
    help: {
      describe: 'show help',
      boolean: true,
      alias: 'h'
    },
    version: {
      describe: 'show version number',
      boolean: true,
      alias: 'v'
    },
    drive: {
      describe: 'drive',
      string: true,
      alias: 'd'
    },
    check: {
      describe: 'validate write',
      boolean: true,
      alias: 'c',
      default: true
    },
    robot: {
      describe: 'parse-able output without interactivity',
      boolean: true,
      alias: 'r'
    },
    yes: {
      describe: 'confirm non-interactively',
      boolean: true,
      alias: 'y'
    },
    unmount: {
      describe: 'unmount on success',
      boolean: true,
      alias: 'u',
      default: true
    }
  })
  .parse(process.argv.slice(2));
