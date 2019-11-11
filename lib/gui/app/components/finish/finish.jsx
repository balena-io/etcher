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

// eslint-disable-next-line no-unused-vars
import React from 'react'
import _ from 'lodash'
import uuidV4 from 'uuid/v4'
import {
  Box,
  Heading,
  Provider
} from 'rendition'
import SvgIcon from '../svg-icon/svg-icon.jsx'
import FlashResults from '../flash-results/flash-results.jsx'
import FlashAnother from '../flash-another/flash-another.jsx'
import store from '../../models/store'
import flashState from '../../models/flash-state'
import selectionState from '../../models/selection-state'
import analytics from '../../modules/analytics'
import updateLock from '../../modules/update-lock'
import messages from '../../../../shared/messages'
import { open as osOpenExternal } from '../../os/open-external/services/open-external'

import './styles/_finish.scss'

const restart = (options, $state) => {
  if (!options.preserveImage) {
    selectionState.deselectImage()
  }
  selectionState.deselectAllDrives()
  analytics.logEvent('Restart', _.assign({
    applicationSessionUuid: store.getState().toJS().applicationSessionUuid,
    flashingWorkflowUuid: store.getState().toJS().flashingWorkflowUuid
  }, options))

  // Re-enable lock release on inactivity
  updateLock.resume()

  // Reset the flashing workflow uuid
  store.dispatch({
    type: 'SET_FLASHING_WORKFLOW_UUID',
    data: uuidV4()
  })

  $state.go('main')
}

const formattedErrors = () => {
  const errors = _.map(_.get(flashState.getFlashResults(), [ 'results', 'errors' ]), (error) => {
    return `${error.device}: ${error.message || error.code}`
  })
  return errors.join('\n')
}

const FinishPage = (props) => {
  const { $state } = props
  const results = flashState.getFlashResults().results || {}
  const progressMessage = messages.progress
  return (
    <Provider>
      <div className="page-finish row around-xs">
        <div className="col-xs">
          <Box>
            <FlashResults
              results={results}
              message={progressMessage}
              errors={formattedErrors}>
            </FlashResults>

            <FlashAnother onClick={(options) => restart(options, $state)}>
            </FlashAnother>
          </Box>

          <Box>
            <div className="fallback-banner">
              <Heading.h3>Thanks for using
                <span onClick={() => osOpenExternal('https://etcher.io?ref=etcher_offline_banner')}>
                  <SvgIcon paths={[ '../../assets/etcher.svg' ]}
                    width='165px'
                    height='auto'>
                  </SvgIcon>
                </span>
              </Heading.h3>
              <div className="caption caption-small fallback-footer">
                made with
                <SvgIcon paths={[ '../../assets/love.svg' ]}
                  width='auto'
                  height='20px'>
                </SvgIcon>
                by
                <span onClick={() => osOpenExternal('https://resin.io?ref=etcher_success')}>
                  <SvgIcon paths={[ '../../assets/balena.svg' ]}
                    width='auto'
                    height='20px'>
                  </SvgIcon>
                </span>
                <div className="section-footer">
                  <span className="caption caption-small footer-right"
                    manifest-bind="version"
                    onClick={() => osOpenExternal('https://github.com/resin-io/etcher/blob/master/CHANGELOG.md')}></span>
                </div>
              </div>
            </div>
          </Box>
        </div>
      </div>
    </Provider>
  )
}

export default FinishPage
