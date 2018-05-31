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

const path = require('path')

const Bluebird = require('bluebird')
const React = require('react')
const propTypes = require('prop-types')
const styled = require('styled-components').default
const rendition = require('rendition')
const colors = require('./colors')

const Breadcrumbs = require('./path-breadcrumbs')
const FileList = require('./file-list')
const RecentFiles = require('./recent-files')

const selectionState = require('../../../models/selection-state')
const osDialog = require('../../../os/dialog')
const exceptionReporter = require('../../../modules/exception-reporter')
const messages = require('../../../../../shared/messages')
const errors = require('../../../../../shared/errors')
const imageStream = require('../../../../../sdk/image-stream')
const supportedFormats = require('../../../../../shared/supported-formats')
const analytics = require('../../../modules/analytics')

const debug = require('debug')('etcher:gui:file-selector')

/**
 * @summary Flex styled component
 * @function
 * @type {ReactElement}
 */
const Flex = styled.div`
  display: flex;
  flex: ${ props => props.flex };
  flex-direction: ${ props => props.direction };
  justify-content: ${ props => props.justifyContent };
  align-items: ${ props => props.alignItems };
  flex-wrap: ${ props => props.wrap };
  flex-grow: ${ props => props.grow };
`

const Header = Flex.extend`
  margin: 10px 15px 0;

  > * {
    margin: 5px;
  }
`

const Main = Flex.extend``

const Footer = Flex.extend`
  margin: 10px 20px;
  flex: 0 0 auto;

  > * {
    margin: 0 10px;
  }
`

class FileSelector extends React.PureComponent {
  constructor (props) {
    super(props)
    this.highlighted = null
    this.state = {
      path: props.path,
      files: [],
    }
  }

  confirmSelection () {
    if (this.highlighted) {
      this.selectFile(this.highlighted)
    }
  }

  close () {
    this.props.close()
  }

  componentDidUpdate () {
    debug('FileSelector:componentDidUpdate')
  }

  navigate (newPath) {
    debug('FileSelector:navigate', newPath)
    this.setState({ path: newPath })
  }

  navigateUp () {
    const newPath = path.join( this.state.path, '..' )
    debug('FileSelector:navigateUp', this.state.path, '->', newPath)
    this.setState({ path: newPath })
  }

  selectImage (image) {
    debug('FileSelector:selectImage', image)

    if (!supportedFormats.isSupportedImage(image.path)) {
      const invalidImageError = errors.createUserError({
        title: 'Invalid image',
        description: messages.error.invalidImage(image)
      })

      osDialog.showError(invalidImageError)
      analytics.logEvent('Invalid image', image)
      return
    }

    return Bluebird.try(() => {
      let message = null

      if (supportedFormats.looksLikeWindowsImage(image.path)) {
        analytics.logEvent('Possibly Windows image', image)
        message = messages.warning.looksLikeWindowsImage()
      } else if (!image.hasMBR) {
        analytics.logEvent('Missing partition table', image)
        message = messages.warning.missingPartitionTable()
      }

      if (message) {
        // TODO: `Continue` should be on a red background (dangerous action) instead of `Change`.
        // We want `X` to act as `Continue`, that's why `Continue` is the `rejectionLabel`
        return osDialog.showWarning({
          confirmationLabel: 'Change',
          rejectionLabel: 'Continue',
          title: 'Warning',
          description: message
        })
      }

      return false
    }).then((shouldChange) => {
      if (shouldChange) {
        return
      }

      selectionState.selectImage(image)

      this.close()

      // An easy way so we can quickly identify if we're making use of
      // certain features without printing pages of text to DevTools.
      image.logo = Boolean(image.logo)
      image.bmap = Boolean(image.bmap)

      analytics.logEvent('Select image', image)
    }).catch(exceptionReporter.report)
  }

  selectFile (file) {
    debug('FileSelector:selectFile', file)

    if (file.isDirectory) {
      this.navigate(file.path)
      return
    }

    debug('FileSelector:getImageMetadata', file)

    imageStream.getImageMetadata(file.path)
      .then((imageMetadata) => {
        debug('FileSelector:getImageMetadata', imageMetadata)
        return this.selectImage(imageMetadata)
      })
      .catch((error) => {
        debug('FileSelector:getImageMetadata', error)
        const imageError = errors.createUserError({
          title: 'Error opening image',
          description: messages.error.openImage(path.basename(file.path), error.message)
        })

        osDialog.showError(imageError)
        analytics.logException(error)
      })
  }

  onHighlight (file) {
    this.highlighted = file
  }

  render () {
    const styles = {
      display: 'flex',
      height: 'calc(100vh - 20px)',
    }
    return (
      <rendition.Provider style={ styles }>
        {/*<RecentFiles flex="0 0 auto"
          selectFile={ ::this.selectFile }
          navigate={ ::this.navigate } />*/}
        <Flex direction="column" grow="1">
          <Header flex="0 0 auto" alignItems="baseline">
            <rendition.Button
              bg={ colors.secondary.background }
              color={ colors.primary.color }
              onClick={ ::this.navigateUp }>
              <span className="fas fa-angle-left" />
              &nbsp;Back
            </rendition.Button>
            <span className="fas fa-hdd" />
            <Breadcrumbs
              path={ this.state.path }
              navigate={ ::this.navigate }
              constraints={ this.props.constraints }
            />
          </Header>
          <Main flex="1">
            <Flex direction="column" grow="1">
              <FileList path={ this.state.path }
                onHighlight={ ::this.onHighlight }
                onSelect={ ::this.selectFile }></FileList>
            </Flex>
          </Main>
          <Footer justifyContent="flex-end">
            <rendition.Button onClick={ ::this.close }>Cancel</rendition.Button>
            <rendition.Button
              primary
              onClick={ ::this.confirmSelection }>
              Select file
            </rendition.Button>
          </Footer>
        </Flex>
      </rendition.Provider>
    )
  }
}

FileSelector.propTypes = {
  path: propTypes.string,
  close: propTypes.func,
  constraints: propTypes.arrayOf(propTypes.string)
}

module.exports = FileSelector
