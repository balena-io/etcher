/*
 * Copyright 2016 Resin.io
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

const fs = require('fs');
const options = require('./cli');
const logStream = options.log ? fs.createWriteStream(options.log) : null;
const STDOUT_STREAM = logStream || process.stdout;
const STDERR_STREAM = logStream || process.stderr;

/**
 * The purpose of this module is to workaround an Electron Windows issue
 * where an Electron process with `ELECTRON_RUN_AS_NODE` enabled will
 * not attach `stdout`/`stderr` to the process, therefore not allowing
 * us to redirect output to a file from `child_process` or console pipes.
 *
 * A temporary solution is to implement logic that redirects output
 * to a log file in the Etcher CLI.
 *
 * TODO: Delete this file, and the corresponding `--log` option once
 * this issue is fixed in Electron.
 * See: https://github.com/electron/electron/issues/5715
 */

/**
 * @summary Write a line to stdout
 * @function
 * @public
 *
 * @description
 * If the `--log` option was passed, this function writes the line
 * to it, otherwise to `process.stdout`.
 *
 * @param {String} line - line
 *
 * @example
 * log.toStdout('Hello world!');
 */
exports.toStdout = (line) => {
  STDOUT_STREAM.write(line + '\n');
};

/**
 * @summary Write a line to stderr
 * @function
 * @public
 *
 * @description
 * If the `--log` option was passed, this function writes the line
 * to it, otherwise to `process.stderr`.
 *
 * @param {String} line - line
 *
 * @example
 * log.toStderr('Hello world!');
 */
exports.toStderr = (line) => {
  STDERR_STREAM.write(line + '\n');
};

/**
 * @summary Close any used streams, if needed
 * @function
 * @public
 *
 * @example
 * log.close();
 */
exports.close = () => {
  if (logStream) {
    logStream.close();
  }
};
