'use strict'

const React = require('react')
const PropTypes = require('prop-types')
const jQuery = require('jquery')
const keyboard = require('virtual-keyboard/dist/js/jquery.keyboard.js')

/**
 * On-screen keyboard react component
 */
class VirtualKeyboard extends React.Component {
  constructor(props) {
    super(props)

    this.state = {
      value: '',
      className: 'keyboard-wrapper'
    }
  }

  componentDidMount() {
    // Set Value to Input Element on Accept
    this.setState({
      value: this.props.value
    })

    this.props.options.accepted = (event, keyboard, el) => {
      this.handleChange('', el.value)
      if (typeof this.props.onAccepted === 'function') {
        this.props.onAccepted(el.value)
      }
      if (this.props.debug) {
        console.log('The content "' + el.value + '" was accepted')
      }
    }

    // Set Class to visible
    this.props.options.visible = () => {
      this.setState({
        className: 'keyboard-wrapper open'
      })
    }

    this.props.options.hidden = () => {
      this.setState({
        className: 'keyboard-wrapper'
      })
    }

    // Set Value to Input Element on Change if prop set
    if (this.props.options.updateOnChange === true) {
      this.props.options.change = (event, keyboard, el) => {
        this.handleChange('', keyboard.preview.value)
        if (this.props.debug) {
          console.log('The content "' + el.value + '" was changed')
        }
      }
    }

    // Add jQuery Keyboard to DOM Element
    this.addKeyBoardToDOM()

    // Update while typing if usePreview is false
    if (this.props.options.usePreview === false) {
      jQuery(this.keyboardRef).on('keyboardChange', (event, keyboard) => {
        this.handleChange(null, keyboard.preview.value)
      })
    }
  }

  addKeyBoardToDOM() {
    let keyboardSelector = jQuery(this.keyboardRef)
    keyboardSelector.keyboard(this.props.options)

    /**
     * Get instantiated keyboard
     */
    this.keyboard = keyboardSelector.getkeyboard()

    /**
     * Get keyboard plugin interface
     * Useful for accessing root plugin functionality
     * 
     * @example
     * // Listen for enter button press
     * this.keyboard.interface.keyaction.enter = (base) => {
     *  // Enter button pressed, accepting content
     *  return this.keyboard.interface.keyaction.accept(base)
     * }
     */
    this.interface = keyboard
  }

  clear() {
    this.setState({
      value: ''
    })
  }

  select() {
    this.keyboardRef.select()
  }

  blur() {
    var keyboard = jQuery(this.keyboardRef)
    if (keyboard && typeof keyboard.getkeyboard === 'function' && typeof keyboard.getkeyboard().close === 'function')
      keyboard.getkeyboard().close()
    this.keyboardRef.blur()
  }

  checkValidity() {
    return this.keyboardRef.checkValidity()
  }

  handleChange (event, input) {
    if (!input && event && event.target && typeof event.target.value != 'undefined')
      input = event.target.value
    if (this.props.debug) {
      console.log('Change', input)
    }
    this.setState({
      value: input
    })
    this.props.onChange(input)
  }
  
  componentWillUnmount() {
    jQuery(this.keyboardRef).remove()
  }

  render() {
    var { options, value, validation, onChange, ...other } = this.props

    var element

    if (this.props.options.type === 'textarea')
      element = (
        <textarea ref={node => this.keyboardRef = node} value = { this.state.value } onChange = { this.handleChange } {...other}/>
      )
    else
      element = (
        <input ref={node => this.keyboardRef = node} value = { this.state.value } onChange = { this.handleChange } {...other} />
      )

    return (
      <div className={this.state.className} > { element } </div>
    )
  }
}

VirtualKeyboard.propTypes = {
  value: PropTypes.string,
  options: PropTypes.object,
  onAccepted: PropTypes.func,
  onChange: PropTypes.func,
  debug: PropTypes.bool,
  validation: PropTypes.func
}

module.exports = VirtualKeyboard
