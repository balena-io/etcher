'use strict'

var angular = require('angular')
const electron = require('electron')
const Bluebird = require('bluebird')
const semver = require('semver')
const EXIT_CODES = require('../../shared/exit-codes')
const messages = require('../../shared/messages')
const s3Packages = require('../../shared/s3-packages')
const release = require('../../shared/release')
const store = require('../../shared/store')
const errors = require('../../shared/errors')
const packageJSON = require('../../../package.json')
const flashState = require('../../shared/models/flash-state')
const settings = require('./models/settings')
const windowProgress = require('./os/window-progress')
const analytics = require('./modules/analytics')
const updateNotifier = require('./components/update-notifier')
const availableDrives = require('../../shared/models/available-drives')
const selectionState = require('../../shared/models/selection-state')
const driveScanner = require('./modules/drive-scanner')
const osDialog = require('./os/dialog')
const exceptionReporter = require('./modules/exception-reporter')

const app = angular.module('Etcher', [
  require('angular-ui-router'),
  require('angular-ui-bootstrap'),
  require('angular-if-state'),

  // Components
  require('./components/svg-icon'),
  require('./components/warning-modal/warning-modal'),
  require('./components/safe-webview'),

  // Pages
  require('./pages/main/main'),
  require('./pages/finish/finish'),
  require('./pages/settings/settings'),

  // OS
  require('./os/open-external/open-external'),
  require('./os/dropzone/dropzone'),

  // Utils
  require('./utils/manifest-bind/manifest-bind')
])

console.log('HELLO')
