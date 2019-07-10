/*
 * Copyright 2019 resin.io
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

import * as angular from 'angular';
import { react2angular } from 'react2angular';

import { DriveSelector2 } from './drive-selector.tsx';

const MODULE_NAME = 'Etcher.Components.DriveSelector2'

angular
	.module(MODULE_NAME, [])
	.component('driveSelector2', react2angular(DriveSelector2, ['close']))

export = MODULE_NAME;
