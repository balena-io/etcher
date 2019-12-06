/*
 * Copyright 2016 balena.io
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

const _ = require('lodash')
const resinCorvus = require('resin-corvus/browser')
const packageJSON = require('../../../../package.json')
const settings = require('../models/settings')
const { getConfig, hasProps } = require('../../../shared/utils')

const sentryToken = settings.get('analyticsSentryToken') ||
  _.get(packageJSON, [ 'analytics', 'sentry', 'token' ])
const mixpanelToken = settings.get('analyticsMixpanelToken') ||
  _.get(packageJSON, [ 'analytics', 'mixpanel', 'token' ])

const configUrl = settings.get('configUrl') || 'https://balena.io/etcher/static/config.json'

const DEFAULT_PROBABILITY = 0.1

const services = {
  sentry: sentryToken,
  mixpanel: mixpanelToken
}
resinCorvus.install({
  services,
  options: {
    release: packageJSON.version,
    shouldReport: () => {
      return settings.get('errorReporting')
    },
    mixpanelDeferred: true
  }
})

let mixpanelSample = DEFAULT_PROBABILITY

/**
 * @summary Init analytics configurations
 * @example initConfig()
 */
const initConfig = async () => {
  let validatedConfig = null
  try {
    const config = await getConfig(configUrl)
    const mixpanel = _.get(config, [ 'analytics', 'mixpanel' ], {})
    mixpanelSample = mixpanel.probability || DEFAULT_PROBABILITY
    if (isClientEligible(mixpanelSample)) {
      validatedConfig = validateMixpanelConfig(mixpanel)
    }
  } catch (err) {
    resinCorvus.logException(err)
  }
  resinCorvus.setConfigs({
    mixpanel: validatedConfig
  })
}

initConfig()

/**
 * @summary Check that the client is eligible for analytics
 * @param {Object} - config
 */
// eslint-disable-next-line
function isClientEligible(probability) {
  return Math.random() < probability
}

/**
 * @summary Check that config has at least HTTP_PROTOCOL and api_host
 * @param {Object} - config
 */
// eslint-disable-next-line
function validateMixpanelConfig (config) {
  /* eslint-disable camelcase */
  const mixpanelConfig = {
    api_host: 'https://api.mixpanel.com'
  }
  if (hasProps(config, [ 'HTTP_PROTOCOL', 'api_host' ])) {
    mixpanelConfig.api_host = `${config.HTTP_PROTOCOL}://${config.api_host}`
  }
  return mixpanelConfig
  /* eslint-enable camelcase */
}

/**
 * @summary Log a debug message
 * @function
 * @public
 *
 * @description
 * This function sends the debug message to error reporting services.
 *
 * @param {String} message - message
 *
 * @example
 * analytics.log('Hello World');
 */
exports.logDebug = resinCorvus.logDebug

/**
 * @summary Log an event
 * @function
 * @public
 *
 * @description
 * This function sends the debug message to product analytics services.
 *
 * @param {String} message - message
 * @param {Object} [data] - event data
 *
 * @example
 * analytics.logEvent('Select image', {
 *   image: '/dev/disk2'
 * });
 */
exports.logEvent = (message, data) => {
  resinCorvus.logEvent(message, { ...data, sample: mixpanelSample })
}

/**
 * @summary Log an exception
 * @function
 * @public
 *
 * @description
 * This function logs an exception to error reporting services.
 *
 * @param {Error} exception - exception
 *
 * @example
 * analytics.logException(new Error('Something happened'));
 */
exports.logException = resinCorvus.logException
