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

const React = require('react')
const ReactDOM = require('react-dom')
const propTypes = require('prop-types')
const { Provider, Modal, Txt, Box } = require('rendition')

const { ModalHeader, CloseButton, ModalBody} = require('./modal-styles')
const { colors } = require('./../../theme')

class DetailsModal extends React.Component {

  renderDetails() {
    return this.props.details.map((line) =>
      <Box key={line.path} mb='10px'>
        <Txt bold color={colors.light.foreground}> {line.name} - {line.size} </Txt>
        <Txt bold color={colors.default.foreground}> {line.path} </Txt>
      </Box>
    )
  }

  render(){
    return (
      <Provider>
        <Modal
          w='400px'
          style={{padding: '0 15px 15px 15px'}}
          titleElement={
            <React.Fragment>
              <ModalHeader>
                <Txt>{this.props.title}</Txt>
                <CloseButton
                  plaintext
                  onClick={this.props.callback}
                >
                &times;
                </CloseButton>
              </ModalHeader>
            </React.Fragment>
          }
          done={this.props.callback}
        >
          <ModalBody>
            {this.renderDetails()}
          </ModalBody>
        </Modal>
      </Provider>
    )
  }
}

DetailsModal.propTypes = {
  title: propTypes.string,
  details: propTypes.array,
  callback: propTypes.func
}

exports.DetailsModal = DetailsModal
