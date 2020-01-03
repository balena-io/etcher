/*
 * Copyright 2018 balena.io
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
 * @module Etcher.Components.SafeWebview
 */

import * as angular from 'angular';
import { react2angular } from 'react2angular';
import * as SafeWebview from './safe-webview';

export const MODULE_NAME = 'Etcher.Components.SafeWebview';
const AngularSafeWebview = angular.module(MODULE_NAME, []);

AngularSafeWebview.component('safeWebview', react2angular(SafeWebview));
