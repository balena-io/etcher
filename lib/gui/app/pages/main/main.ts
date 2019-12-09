/*
 * Copyright 2019 balena.io
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

/**
 * This page represents the application main page.
 *
 * @module Etcher.Pages.Main
 */

import * as angular from 'angular';
// @ts-ignore
import * as angularRouter from 'angular-ui-router';
import { react2angular } from 'react2angular';
import MainPage from './MainPage';

import * as driveSelector from '../../components/drive-selector';
import * as driveSelectorService from '../../components/drive-selector/drive-selector';
import { MODULE_NAME as flashAnother } from '../../components/flash-another';
import { MODULE_NAME as flashResults } from '../../components/flash-results';
import * as byteSize from '../../utils/byte-size/byte-size';

export const MODULE_NAME = 'Etcher.Pages.Main';

const Main = angular.module(MODULE_NAME, [
	angularRouter,
	driveSelectorService,
	flashAnother,
	flashResults,
	driveSelector,
	byteSize,
]);

Main.component(
	'mainPage',
	react2angular(MainPage, [], ['DriveSelectorService', '$state']),
);

Main.config(($stateProvider: any) => {
	$stateProvider.state('main', {
		url: '/main',
		template: '<main-page style="width:100%"></main-page>',
	});
});
