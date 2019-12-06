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

const React = require('react')
const propTypes = require('prop-types')
const SafeWebview = require('../safe-webview/safe-webview.jsx')
const settings = require('../../models/settings')
const analytics = require('../../modules/analytics')

class FeaturedProject extends React.Component {
  constructor (props) {
    super(props)

    this.state = {
      endpoint: null
    }
  }

  componentDidMount () {
    return settings.load()
      .then(() => {
        const endpoint = settings.get('featuredProjectEndpoint') || 'https://assets.balena.io/etcher-featured/index.html'
        this.setState({ endpoint })
      })
      .catch(analytics.logException)
  }

  render () {
    return (this.state.endpoint) ? (
      <SafeWebview
        src={this.state.endpoint}
        {...this.props}>
      </SafeWebview>
    ) : null
  }
}

FeaturedProject.propTypes = {
  onWebviewShow: propTypes.func
}

module.exports = FeaturedProject
