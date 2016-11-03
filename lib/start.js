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

// See http://electron.atom.io/docs/v0.37.7/api/environment-variables/#electronrunasnode
//
// Notice that if running electron with `ELECTRON_RUN_AS_NODE`, the binary
// *won't* attempt to load the `app.asar` application by default, therefore
// if passing `ELECTRON_RUN_AS_NODE`, you have to pass the path to the asar
// or the entry point file (this file) manually as an argument.
//
// We also consider `ATOM_SHELL_INTERNAL_RUN_AS_NODE`, which is basically
// an older equivalent of `ELECTRON_RUN_AS_NODE` that still gets set when
// using `child_process.fork()`.
if (process.env.ELECTRON_RUN_AS_NODE || process.env.ATOM_SHELL_INTERNAL_RUN_AS_NODE) {
  require('./cli/etcher');

} else {
  require('./gui/etcher');
}
