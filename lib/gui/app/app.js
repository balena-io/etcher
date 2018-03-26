'use strict'

var angular = require('angular')
const electron = require('electron')
const Bluebird = require('bluebird')
const semver = require('semver')
const packageJSON = require('../../../package.json')
const settings = require('./models/settings')
const windowProgress = require('./os/window-progress')
const analytics = require('./modules/analytics')
const updateNotifier = require('./components/update-notifier')
const driveScanner = require('./modules/drive-scanner')
const osDialog = require('./os/dialog')
const exceptionReporter = require('./modules/exception-reporter')

console.log('HELLO')
