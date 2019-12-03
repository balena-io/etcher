/*
 * Copyright 2016 resin.io
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

const Bluebird = require('bluebird')
const sdk = require('etcher-sdk')
const _ = require('lodash')
const path = require('path')
const propTypes = require('prop-types')
const React = require('react')
const Dropzone = require('react-dropzone').default
const errors = require('../../../../shared/errors')
const messages = require('../../../../shared/messages')
const supportedFormats = require('../../../../shared/supported-formats')
const shared = require('../../../../shared/units')
const selectionState = require('../../models/selection-state')
const settings = require('../../models/settings')
const store = require('../../models/store')
const analytics = require('../../modules/analytics')
const exceptionReporter = require('../../modules/exception-reporter')
const osDialog = require('../../os/dialog')
const { replaceWindowsNetworkDriveLetter } = require('../../os/windows-network-drives')
const {
  StepButton,
  StepNameButton,
  StepSelection,
  Footer,
  Underline,
  DetailsText,
  ChangeButton,
  ThemedProvider
} = require('../../styled-components')
const {
  Modal
} = require('rendition')
const middleEllipsis = require('../../utils/middle-ellipsis')
const SVGIcon = require('../svg-icon/svg-icon.jsx')
const { default: styled } = require('styled-components')

// TODO move these styles to rendition
const ModalText = styled.p `
  a {
    color: rgb(0, 174, 239);

    &:hover {
      color: rgb(0, 139, 191);
    }
  }
`

/**
 * @summary Main supported extensions
 * @constant
 * @type {String[]}
 * @public
 */
const mainSupportedExtensions = _.intersection([
  'img',
  'iso',
  'zip'
], supportedFormats.getAllExtensions())

/**
 * @summary Extra supported extensions
 * @constant
 * @type {String[]}
 * @public
 */
const extraSupportedExtensions = _.difference(
  supportedFormats.getAllExtensions(),
  mainSupportedExtensions
).sort()

const getState = () => {
  return {
    hasImage: selectionState.hasImage(),
    imageName: selectionState.getImageName(),
    imageSize: selectionState.getImageSize()
  }
}

class ImageSelector extends React.Component {
  constructor (props) {
    super(props)

    this.state = {
      ...getState(),
      warning: null
    }

    this.openImageSelector = this.openImageSelector.bind(this)
    this.reselectImage = this.reselectImage.bind(this)
    this.handleOnDrop = this.handleOnDrop.bind(this)
  }

  componentDidMount () {
    this.unsubscribe = store.observe(() => {
      this.setState(getState())
    })
  }

  componentWillUnmount () {
    this.unsubscribe()
  }

  reselectImage () {
    analytics.logEvent('Reselect image', {
      previousImage: selectionState.getImage(),
      applicationSessionUuid: store.getState().toJS().applicationSessionUuid,
      flashingWorkflowUuid: store.getState().toJS().flashingWorkflowUuid
    })

    this.openImageSelector()
  }

  selectImage (image) {
    if (!supportedFormats.isSupportedImage(image.path)) {
      const invalidImageError = errors.createUserError({
        title: 'Invalid image',
        description: messages.error.invalidImage(image)
      })

      osDialog.showError(invalidImageError)
      analytics.logEvent('Invalid image', _.merge({
        applicationSessionUuid: store.getState().toJS().applicationSessionUuid,
        flashingWorkflowUuid: store.getState().toJS().flashingWorkflowUuid
      }, image))
      return
    }

    Bluebird.try(() => {
      let message = null
      let title = null

      if (supportedFormats.looksLikeWindowsImage(image.path)) {
        analytics.logEvent('Possibly Windows image', {
          image,
          applicationSessionUuid: store.getState().toJS().applicationSessionUuid,
          flashingWorkflowUuid: store.getState().toJS().flashingWorkflowUuid
        })
        message = messages.warning.looksLikeWindowsImage()
        title = 'Possible Windows image detected'
      } else if (!image.hasMBR) {
        analytics.logEvent('Missing partition table', {
          image,
          applicationSessionUuid: store.getState().toJS().applicationSessionUuid,
          flashingWorkflowUuid: store.getState().toJS().flashingWorkflowUuid
        })
        title = 'Missing partition table'
        message = messages.warning.missingPartitionTable()
      }

      if (message) {
        this.setState({
          warning: {
            message,
            title
          }
        })

        return
      }

      return false
    }).then(() => {
      selectionState.selectImage(image)

      // An easy way so we can quickly identify if we're making use of
      // certain features without printing pages of text to DevTools.
      image.logo = Boolean(image.logo)
      image.blockMap = Boolean(image.blockMap)

      return analytics.logEvent('Select image', {
        image,
        applicationSessionUuid: store.getState().toJS().applicationSessionUuid,
        flashingWorkflowUuid: store.getState().toJS().flashingWorkflowUuid
      })
    }).catch(exceptionReporter.report)
  }

  async selectImageByPath (imagePath) {
    try {
      // eslint-disable-next-line no-param-reassign
      imagePath = await replaceWindowsNetworkDriveLetter(imagePath)
    } catch (error) {
      analytics.logException(error)
    }
    if (!supportedFormats.isSupportedImage(imagePath)) {
      const invalidImageError = errors.createUserError({
        title: 'Invalid image',
        description: messages.error.invalidImage(imagePath)
      })

      osDialog.showError(invalidImageError)
      analytics.logEvent('Invalid image', { path: imagePath })
      return
    }

    const source = new sdk.sourceDestination.File(imagePath, sdk.sourceDestination.File.OpenFlags.Read)
    try {
      const innerSource = await source.getInnerSource()
      const metadata = await innerSource.getMetadata()
      const partitionTable = await innerSource.getPartitionTable()
      if (partitionTable) {
        metadata.hasMBR = true
        metadata.partitions = partitionTable.partitions
      }
      metadata.path = imagePath
      // eslint-disable-next-line no-magic-numbers
      metadata.extension = path.extname(imagePath).slice(1)
      this.selectImage(metadata)
    } catch (error) {
      const imageError = errors.createUserError({
        title: 'Error opening image',
        description: messages.error.openImage(path.basename(imagePath), error.message)
      })
      osDialog.showError(imageError)
      analytics.logException(error)
    } finally {
      try {
        await source.close()
      } catch (error) {
        // Noop
      }
    }
  }

  /**
   * @summary Open image selector
   * @function
   * @public
   *
   * @example
   * ImageSelectionController.openImageSelector();
   */
  openImageSelector () {
    analytics.logEvent('Open image selector', {
      applicationSessionUuid: store.getState().toJS().applicationSessionUuid,
      flashingWorkflowUuid: store.getState().toJS().flashingWorkflowUuid
    })

    if (settings.get('experimentalFilePicker')) {
      const {
        FileSelectorService
      } = this.props

      FileSelectorService.open()
    } else {
      osDialog.selectImage().then((imagePath) => {
        // Avoid analytics and selection state changes
        // if no file was resolved from the dialog.
        if (!imagePath) {
          analytics.logEvent('Image selector closed', {
            applicationSessionUuid: store.getState().toJS().applicationSessionUuid,
            flashingWorkflowUuid: store.getState().toJS().flashingWorkflowUuid
          })
          return
        }

        this.selectImageByPath(imagePath)
      }).catch(exceptionReporter.report)
    }
  }

  handleOnDrop (acceptedFiles) {
    const [ file ] = acceptedFiles

    if (file) {
      this.selectImageByPath(file.path)
    }
  }

  // TODO add a visual change when dragging a file over the selector
  render () {
    const {
      flashing,
      showSelectedImageDetails
    } = this.props

    const hasImage = selectionState.hasImage()

    const imageBasename = hasImage ? path.basename(selectionState.getImagePath()) : ''
    const imageName = selectionState.getImageName()
    const imageSize = selectionState.getImageSize()

    return (
      <ThemedProvider>
        <Dropzone multiple={false} noClick onDrop={this.handleOnDrop}>
          {({ getRootProps, getInputProps }) => (
            <div className="box text-center relative" {...getRootProps()}>
              <input {...getInputProps()} />
              <div className="center-block">
                <SVGIcon contents={selectionState.getImageLogo()} paths={[ '../../assets/image.svg' ]} />
              </div>

              <div className="space-vertical-large">
                {hasImage ? (
                  <React.Fragment>
                    <StepNameButton
                      plain
                      onClick={showSelectedImageDetails}
                      tooltip={imageBasename}
                    >
                      {/* eslint-disable no-magic-numbers */}
                      { middleEllipsis(imageName || imageBasename, 20) }
                    </StepNameButton>
                    { !flashing &&
                      <ChangeButton
                        plain
                        mb={14}
                        onClick={this.reselectImage}
                      >
                        Change
                      </ChangeButton>
                    }
                    <DetailsText>
                      {shared.bytesToClosestUnit(imageSize)}
                    </DetailsText>
                  </React.Fragment>
                ) : (
                  <StepSelection>
                    <StepButton
                      onClick={this.openImageSelector}
                    >
                      Select image
                    </StepButton>
                    <Footer>
                      { mainSupportedExtensions.join(', ') }, and{' '}
                      <Underline
                        tooltip={ extraSupportedExtensions.join(', ') }
                      >
                        many more
                      </Underline>
                    </Footer>
                  </StepSelection>
                )}
              </div>
            </div>
          )}
        </Dropzone>

        {Boolean(this.state.warning) && (
          <Modal
            title={(
              <span>
                <span style={{ color: '#d9534f' }} className="glyphicon glyphicon-exclamation-sign"></span>
                {' '}
                <span>{this.state.warning.title}</span>
              </span>
            )}
            action='Continue'
            cancel={() => {
              this.setState({ warning: null })
              this.reselectImage()
            }}
            done={() => {
              this.setState({ warning: null })
            }}
            primaryButtonProps={{ warning: true, primary: false }}
          >
            <ModalText dangerouslySetInnerHTML={{ __html: this.state.warning.message }} />
          </Modal>
        )}
      </ThemedProvider>
    )
  }
}

ImageSelector.propTypes = {
  flashing: propTypes.bool,
  showSelectedImageDetails: propTypes.func
}

module.exports = ImageSelector
