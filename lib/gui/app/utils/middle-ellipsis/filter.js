/*
 * Copyright 2016 Juan Cruz Viotti. https://github.com/jviotti
 * Copyright 2018 resin.io
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

'use strict'

/**
 * The purpose of this module is to provide utilities
 * to work with sizes in bytes.
 *
 * @module Etcher.Utils.MiddleEllipsis
 */

const _ = require('lodash')
const angular = require('angular')
const middleEllipsis = require('../middle-ellipsis')

const MODULE_NAME = 'Etcher.Utils.MiddleEllipsis'
const MiddleEllipsis = angular.module(MODULE_NAME, [])

/* eslint-disable lodash/prefer-lodash-method */

MiddleEllipsis.filter('middleEllipsis', _.constant(middleEllipsis))

/* eslint-enable lodash/prefer-lodash-method */

module.exports = MODULE_NAME
