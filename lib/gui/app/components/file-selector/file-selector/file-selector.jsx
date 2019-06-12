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
const sdk = require('etcher-sdk')

const Bluebird = require('bluebird')
const React = require('react')
const propTypes = require('prop-types')
const styled = require('styled-components').default
const rendition = require('rendition')
const colors = require('./colors')

const Breadcrumbs = require('./path-breadcrumbs')
const FileList = require('./file-list')
const RecentFiles = require('./recent-files')
const files = require('../../../models/files')

const selectionState = require('../../../models/selection-state')
const store = require('../../../models/store')
const osDialog = require('../../../os/dialog')
const exceptionReporter = require('../../../modules/exception-reporter')
const messages = require('../../../../../shared/messages')
const errors = require('../../../../../shared/errors')
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
  overflow: ${ props => props.overflow };
`

const Header = styled(Flex) `
  padding: 10px 15px 0;
  border-bottom: 1px solid ${ colors.primary.faded };

  > * {
    margin: 5px;
  }
`

const Main = styled(Flex) ``

const Footer = styled(Flex) `
  padding: 10px;
  flex: 0 0 auto;
  border-top: 1px solid ${ colors.primary.faded };

  > * {
    margin: 0 10px;
  }

  > button {
    flex-grow: 0;
    flex-shrink: 0;
  }
`

class UnstyledFilePath extends React.PureComponent {
  render () {
    return (
      <div className={ this.props.className }>
        <span>{
          this.props.file && !this.props.file.isDirectory
            ? this.props.file.basename
            : ''
        }</span>
      </div>
    )
  }
}

const FilePath = styled(UnstyledFilePath)`
  display: flex;
  flex-grow: 1;
  align-items: center;
  overflow: hidden;

  > span {
    font-size: 16px;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
`

class FileSelector extends React.PureComponent {
  constructor (props) {
    super(props)

    this.state = {
      path: props.path,
      highlighted: null,
      constraint: null,
      files: [],
    }

  }

  componentDidMount() {
    if (this.props.constraintpath) {
      const device = files.getConstraintDevice(this.props.constraintpath)
      debug('FileSelector:getConstraintDevice', device)
      if (device !== undefined) {
        this.setState({ constraint: device.drive  })
      }
    }
  }

  confirmSelection () {
    if (this.state.highlighted) {
      this.selectFile(this.state.highlighted)
    }
  }

  close () {
    this.props.close()
  }

  componentDidUpdate () {
    debug('FileSelector:componentDidUpdate')
  }

  containPath (newPath) {
    if (this.state.constraint) {
      const isContained = this.state.constraint.mountpoints.some((mount) => {
        return !path.relative(mount.path, newPath).startsWith('..')
      })
      if (!isContained) {
        return '/'
      }
    }
    return newPath
  }

  navigate (newPath) {
    debug('FileSelector:navigate', newPath)
    this.setState({ path: this.containPath(newPath) })
  }

  navigateUp () {
    let newPath = this.containPath(path.join(this.state.path, '..'))
    debug('FileSelector:navigateUp', this.state.path, '->', newPath)
    this.setState({ path: newPath })
  }

  selectImage (image) {
    debug('FileSelector:selectImage', image)

    if (!supportedFormats.isSupportedImage(image.path)) {
      const invalidImageError = errors.createUserError({
        title: 'Invalid image',
        description: messages.error.invalidImage(image.path)
      })

      osDialog.showError(invalidImageError)
      analytics.logEvent('Invalid image', {
        image,
        applicationSessionUuid: store.getState().toJS().applicationSessionUuid,
        flashingWorkflowUuid: store.getState().toJS().flashingWorkflowUuid
      })
      return Bluebird.resolve()
    }

    return Bluebird.try(() => {
      let message = null

      if (supportedFormats.looksLikeWindowsImage(image.path)) {
        analytics.logEvent('Possibly Windows image', {
          image,
          applicationSessionUuid: store.getState().toJS().applicationSessionUuid,
          flashingWorkflowUuid: store.getState().toJS().flashingWorkflowUuid
        })
        message = messages.warning.looksLikeWindowsImage()
      } else if (!image.hasMBR) {
        analytics.logEvent('Missing partition table', {
          image,
          applicationSessionUuid: store.getState().toJS().applicationSessionUuid,
          flashingWorkflowUuid: store.getState().toJS().flashingWorkflowUuid
        })
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
      image.blockMap = Boolean(image.blockMap)

      analytics.logEvent('Select image', {
        image,
        applicationSessionUuid: store.getState().toJS().applicationSessionUuid,
        flashingWorkflowUuid: store.getState().toJS().flashingWorkflowUuid
      })
    }).catch(exceptionReporter.report)
  }

  selectFile (file) {
    debug('FileSelector:selectFile', file)

    if (file.isDirectory) {
      this.navigate(file.path)
      return
    }

    if (!supportedFormats.isSupportedImage(file.path)) {
      const invalidImageError = errors.createUserError({
        title: 'Invalid image',
        description: messages.error.invalidImage(file.path)
      })

      osDialog.showError(invalidImageError)
      analytics.logEvent('Invalid image', { path: file.path })
      return
    }

    debug('FileSelector:getImageMetadata', file)

    const source = new sdk.sourceDestination.File(file.path, sdk.sourceDestination.File.OpenFlags.Read)
    source.getInnerSource()
    .then((innerSource) => {
      return innerSource.getMetadata()
      .then((imageMetadata) => {
        debug('FileSelector:getImageMetadata', imageMetadata)
        imageMetadata.path = file.path
        imageMetadata.extension = path.extname(file.path).slice(1)
        return innerSource.getPartitionTable()
        .then((partitionTable) => {
          if (partitionTable !== undefined) {
            imageMetadata.hasMBR = true
            imageMetadata.partitions = partitionTable.partitions
          }
          return this.selectImage(imageMetadata)
        })
      })
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
    this.setState({ highlighted: file })
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
        <Flex direction="column" grow="1" overflow="auto">
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
              constraintPath={ this.props.constraintpath }
              constraint={ this.state.constraint }
            />
          </Header>
          <Main flex="1">
            <Flex direction="column" grow="1">
              <FileList path={ this.state.path }
                constraintPath={ this.props.constraintpath }
                constraint={ this.state.constraint }
                onHighlight={ ::this.onHighlight }
                onSelect={ ::this.selectFile }></FileList>
            </Flex>
          </Main>
          <Footer justifyContent="flex-end">
            <FilePath file={ this.state.highlighted }></FilePath>
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
  constraintpath: propTypes.string,
}

module.exports = FileSelector
