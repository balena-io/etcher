/*
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

const _ = require('lodash')

const wifiServiceEndpoint = process.env.WIFI_SERVICE_ENDPOINT || 'http://192.168.1.7:1338/wifi'

module.exports = {
  isActive: () => {
    const method = 'get-wifi-active'
    const api = `${wifiServiceEndpoint}/${method}`
    return fetch(api)
      .then((res) => {
        return res.json()
      })
      .then((res) => {
        console.log('active', res);
        return res.active
      })
      .catch((err) => {
        return err
      })
  },

  toggleWifi: (value) => {
    const method = 'toggle-wifi'
    const api = `${wifiServiceEndpoint}/${method}`
    return fetch(api, {
      method: 'POST',
      body: JSON.stringify({ value })
    })
      .then((res) => {
        return res.json()
      })
      .then((res) => {
        console.log('toggle', res);
        return res.active
      })
      .catch((err) => {
        return err
      })
  },

  getNetworks: () => {
    const method = 'list-nearby-networks'
    const api = `${wifiServiceEndpoint}/${method}`
    return fetch(api)
      .then((res) => {
        return res.json()
      })
      .then((networks) => {
        let formattedNetworks = _.map(networks, (network) => {
          const newNetwork = _.reduce(network, (acc, val, key) => {
            if (key === 'security') {
              acc.security = val.open ? 'open' : 'closed'
            } else {
              acc[key.toLowerCase()] = val;
            }
            return acc
          }, {})
          return newNetwork
        })
        return formattedNetworks
      })
      .catch((err) => {
        return err
      })
  },

  getCurrentNetwork: () => {
    const method = 'current-network'
    const api = `${wifiServiceEndpoint}/${method}`
    return fetch(api)
      .then((res) => {
        return res.text()
      })
      .then((network) => {
        if (_.isEmpty(network)) {
          return {}
        }
        return network
      })
      .catch((err) => {
        return err
      })
  },

  connect: (value) => {
    const method = 'connect-network'
    const api = `${wifiServiceEndpoint}/${method}`
    return fetch(api, {
      method: 'POST',
      body: JSON.stringify({ value })
    })
      .then((res) => {
        return res.json()
      })
      .then((success) => {
        console.log('connect', success);
        return success
      })
      .catch((err) => {
        return err
      })
  },

  forget: (value) => {
    const method = 'forget-network'
    const api = `${wifiServiceEndpoint}/${method}`
    return fetch(api, {
      method: 'POST',
      body: JSON.stringify({ value })
    })
      .then((res) => {
        return res.json()
      })
      .then((success) => {
        console.log('forget', success);
        return success
      })
      .catch((err) => {
        return err
      })
  }
}
