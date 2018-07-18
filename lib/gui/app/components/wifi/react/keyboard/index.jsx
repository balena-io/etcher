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

const Types = require('prop-types')
const React = require('react')
const Keyboard = require('react-virtual-keyboard').default

class KBInput extends React.PureComponent {
  componentDidMount () {
    this.keyboard.interface.keyaction.enter = (base) => {
      return this.keyboard.interface.keyaction.accept(base)
    }
  }

  render () {
    return (<Keyboard
      value={this.props.value || ''}
      type={this.props.type || 'text'}
      name="keyboard"
      options={{
        type: 'input',
        layout: 'custom',
        usePreview: false,
        useWheel: false,
        stickyShift: true,
        updateOnChange: true,
        initialFocus: true,
        closeByClickEvent: false,
        beforeVisible: (evt, keyboard, el) => {
          keyboard.$keyboard.show('slide')
        },
        display: {
          'meta-1': '#%&',
          'meta-2': 'ABC'
        },
        customLayout: {
          normal: [
            '1 2 3 4 5 6 7 8 9 0 {b}',
            'q w e r t y u i o p',
            'a s d f g h j k l',
            '{s} z x c v b n m {s}',
            '{meta-1} ! @ {space} , . /'
          ],
          'meta-2': [
            '1 2 3 4 5 6 7 8 9 0 {b}',
            'q w e r t y u i o p',
            'a s d f g h j k l',
            '{s} z x c v b n m {s}',
            '{meta-1} ! @ {space} , . /'
          ],
          shift: [
            '1 2 3 4 5 6 7 8 9 0 {b}',
            'Q W E R T Y U I O P',
            'A S D F G H J K L',
            '{s} Z X C V B N M {e}',
            '{meta-1} ! @ {space} , . /'
          ],
          'meta-2-shift': [
            '1 2 3 4 5 6 7 8 9 0 {b}',
            'Q W E R T Y U I O P',
            'A S D F G H J K L',
            '{s} Z X C V B N M {s}',
            '{meta-1} ! @ {space} , . /'
          ],
          'meta-1': [
            '1 2 3 4 5 6 7 8 9 0 {b}',
            '@ # $ _ & - + ( )',
            '{s} * " \' : ; ! ? / {s}',
            '{meta-2} ! @ {space} , . /'
          ],
          'meta-1-shift': [
            '~ ` | • √ π ÷ x ¶ ∆ {b}',
            '£ ¢ € ¥ ^ ° = { }',
            '{s} % © ® ™ ✔ [ ] \\ {s}',
            '{meta-2} ! @ {space} , . /'
          ]
        }
      }}
      onChange = { this.props.onChange }
      onAccepted = { this.props.onSubmit }
      ref = { (kb) => { this.keyboard = kb }}
    />)
  }
}

KBInput.propTypes = {
  type: Types.string,
  value: Types.string,
  onChange: Types.func,
  onSubmit: Types.func
}

module.exports = KBInput
