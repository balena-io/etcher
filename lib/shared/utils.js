/*
 * Copyright 2017 resin.io
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
const flatten = require('flat').flatten;
const deepMapKeys = require('deep-map-keys');

/**
 * @summary Create a flattened copy of the object with all keys transformed in start case
 * @function
 * @public
 *
 * @param {*} object - object to transform
 * @returns {*} transformed object
 *
 * @example
 * const object = makeFlatStartCaseObject({
 *   image: {
 *     size: 10000000000,
 *     recommendedSize: 10000000000
 *   }
 * })
 *
 * console.log(object)
 * > {
 * >   'Image Size': 10000000000,
 * >   'Image Recommended Size': 10000000000
 * > }
 */
exports.makeFlatStartCaseObject = (object) => {
  if (_.isUndefined(object)) {
    return object;
  }

  // Transform primitives to objects
  if (!_.isObject(object)) {
    return {
      Value: object
    };
  }

  if (_.isArray(object)) {
    return _.map(object, (property) => {
      if (_.isObject(property)) {
        return exports.makeFlatStartCaseObject(property);
      }

      return property;
    });
  }

  const transformedKeysObject = deepMapKeys(object, (key) => {

    // Preserve environment variables
    const regex = /^[A-Z_]+$/;
    if (regex.test(key)) {
      return key;
    }

    return _.startCase(key);
  });

  return flatten(transformedKeysObject, {
    delimiter: ' ',
    safe: true
  });

};
