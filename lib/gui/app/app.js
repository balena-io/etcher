'use strict'

var angular = require('angular')
const electron = require('electron')
const Bluebird = require('bluebird')
const semver = require('semver')

const settings = require('./models/settings')

const windowProgress = require('./os/window-progress')
const osDialog = require('./os/dialog')

const updateNotifier = require('./components/update-notifier')

console.log('HELLO')
