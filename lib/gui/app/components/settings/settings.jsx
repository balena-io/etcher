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
const { useState } = React
const propTypes = require('prop-types')
const _ = require('lodash')
const store = require('../../models/store')
const analytics = require('../../modules/analytics')
const settings = require('../../models/settings')
const { default: styled } = require('styled-components')
const { FaCog } = require('react-icons/fa')
const {
  Badge,
  Button,
  Checkbox,
  Modal,
  Provider
} = require('rendition')
const { colors } = require('../../theme')

const SettingsIcon = styled(FaCog) `
  width: 24px;
  height: 24px;

  &&& {
    color: ${colors.secondary.background}!important;
  }
`

const SettingsButton = () => {
  const [ hideModal, setHideModal ] = useState(true)

  return (
    <Provider>
      <Button
        icon={<SettingsIcon/>}
        plain
        onClick={() => setHideModal(false)}
        tabIndex="5">
      </Button>
      { hideModal ? null : (
        <SettingsModal toggleModal={(value) => setHideModal(!value)}>
        </SettingsModal>
      ) }
    </Provider>
  )
}

SettingsButton.propTypes = {}

const WarningModal = ({
  message,
  confirmLabel,
  cancel,
  done
}) => {
  return (
    <Modal
      title={confirmLabel}
      action={confirmLabel}
      cancel={cancel}
      done={done}
      style={{
        width: 420,
        height: 300
      }}
      primaryButtonProps={{ warning: true }}>
      {message}
    </Modal>
  )
}

const SettingsModal = styled((props) => {
  const [ currentSettings, setCurrentSettings ] = useState(settings.getAll())
  const [ warning, setWarning ] = useState({})

  const toggleSetting = (setting, options) => {
    const value = currentSettings[setting]
    const dangerous = !_.isUndefined(options)

    analytics.logEvent('Toggle setting', {
      setting,
      value,
      dangerous,
      applicationSessionUuid: store.getState().toJS().applicationSessionUuid
    })

    if (value || !dangerous) {
      settings.set(setting, !value)
      setCurrentSettings({
        ...currentSettings,
        [setting]: !value
      })
      return setWarning({})
    }

    // Show warning since it's a dangerous setting
    return setWarning({
      setting,
      settingValue: value,
      ...options
    })
  }

  return (
    <Modal
      id='settings-modal'
      title='Settings'
      done={() => props.toggleModal(false)}
      style={{
        width: 780,
        height: 460
      }}
    >
      <div>
        <div>
          <Checkbox
            toggle
            tabIndex="6"
            label="Anonymously report errors and usage statistics to balena.io"
            checked={currentSettings.errorReporting}
            onChange={() => toggleSetting('errorReporting')}/>
        </div>

        <div>
          {
            // eslint-disable-next-line lines-around-comment
            /* On Windows, "Unmounting" basically means "ejecting".
            * On top of that, Windows users are usually not even
            * familiar with the meaning of "unmount", which comes
            * from the UNIX world. */
          }
          <Checkbox
            toggle
            tabIndex="7"
            label={`
              ${settings.platform === 'win32' ? 'Eject' : 'Auto-unmount'} on success
            `}
            checked={currentSettings.unmountOnSuccess}
            onChange={() => toggleSetting('unmountOnSuccess')}/>
        </div>

        <div>
          <Checkbox
            toggle
            tabIndex="8"
            label="Validate write on success"
            checked={currentSettings.validateWriteOnSuccess}
            onChange={() => toggleSetting('validateWriteOnSuccess')}/>
        </div>

        <div>
          <Checkbox
            toggle
            tabIndex="9"
            label="Trim ext{2,3,4} partitions before writing (raw images only)"
            checked={currentSettings.trim}
            onChange={() => toggleSetting('trim')}/>
        </div>

        <div>
          <Checkbox
            toggle
            tabIndex="10"
            label="Auto-updates enabled"
            checked={currentSettings.updatesEnabled}
            onChange={() => toggleSetting('updatesEnabled')}/>
        </div>

        { settings.get('disableUnsafeMode') ? null : (
          <div>
            <Checkbox
              toggle
              tabIndex="11"
              label={(<span>
                Unsafe mode <Badge danger fontSize={12}>Dangerous</Badge>
              </span>)}
              checked={currentSettings.unsafeMode}
              onChange={() => toggleSetting('unsafeMode', {
                description: `Are you sure you want to turn this on?
                  You will be able to overwrite your system drives if you're not careful.`,
                confirmLabel: 'Enable unsafe mode'
              })}/>
          </div>
        ) }
      </div>

      { _.isEmpty(warning) ? null : (
        <WarningModal
          message={warning.description}
          confirmLabel={warning.confirmLabel}
          done={() => {
            settings.set(warning.setting, !warning.settingValue)
            setCurrentSettings({
              ...currentSettings,
              [warning.setting]: true
            })
            setWarning({})
          }}
          cancel={() => {
            setWarning({})
          }}>
        </WarningModal>
      ) }
    </Modal>
  )
}) `
> div:nth-child(3) {
  justify-content: center;
}
`

SettingsModal.propTypes = {
  toggleModal: propTypes.func
}

module.exports = { SettingsButton, SettingsModal }
