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

/**
 * @module Etcher.Pages.Finish
 */

import * as angular from 'angular';
import { react2angular } from 'react2angular';
import FinishPage from './finish';

export const MODULE_NAME = 'Etcher.Pages.Finish';
const Finish = angular.module(MODULE_NAME, []);

Finish.component('finish', react2angular(FinishPage, [], ['$state']));

Finish.config(($stateProvider: any) => {
	$stateProvider.state('success', {
		url: '/success',
		template: '<finish style="width:100%"></finish>',
	});
});
