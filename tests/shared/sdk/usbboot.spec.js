/*
 * Copyright 2017 resin.io
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

const m = require('mochainon')
const _ = require('lodash')
const Bluebird = require('bluebird')
const usb = require('../../../lib/shared/sdk/utils/usb')
const usbboot = require('../../../lib/shared/sdk/usbboot')

const createUSBDeviceStub = (options) => {
  return {
    deviceDescriptor: {
      idVendor: options.vendorID,
      idProduct: options.productID,
      iManufacturer: options.manufacturerIndex,
      iProduct: options.productIndex
    },
    _configDescriptor: {
      bNumInterfaces: options.interfaces
    },
    open: _.noop,
    close: _.noop,
    getStringDescriptor: (index, callback) => {
      callback(null, options.strings[index])
    }
  }
}

const BCM2835_STUB = createUSBDeviceStub({
  vendorID: 0x0a5c,
  productID: 0x2763,
  manufacturerIndex: 1,
  productIndex: 2,
  interfaces: 1,
  strings: [
    null,
    'Broadcom',
    'BCM2708 Boot'
  ]
})

const BCM2837_STUB = createUSBDeviceStub({
  vendorID: 0x0a5c,
  productID: 0x2764,
  manufacturerIndex: 1,
  productIndex: 2,
  interfaces: 1,
  strings: [
    null,
    'Broadcom',
    'BCM2710 Boot'
  ]
})

const UNSUPPORTED_DEVICE_STUB = createUSBDeviceStub({
  vendorID: 0x9999,
  productID: 0x2763,
  manufacturerIndex: 1,
  productIndex: 2,
  interfaces: 2,
  strings: [
    null,
    'FOO',
    'X2763'
  ]
})

describe('SDK: usbboot', function () {
  describe('.scan()', function () {
    describe('given no available USB devices', function () {
      beforeEach(function () {
        this.usbListDevicesStub = m.sinon.stub(usb, 'listDevices')
        this.usbListDevicesStub.returns(Bluebird.resolve([]))
      })

      afterEach(function () {
        this.usbListDevicesStub.restore()
      })

      it('should resolve an empty array', function () {
        return usbboot.scan().then((devices) => {
          m.chai.expect(devices).to.deep.equal([])
        })
      })
    })

    describe('given a non supported device', function () {
      beforeEach(function () {
        this.usbListDevicesStub = m.sinon.stub(usb, 'listDevices')
        this.usbListDevicesStub.returns(Bluebird.resolve([
          UNSUPPORTED_DEVICE_STUB
        ]))
      })

      afterEach(function () {
        this.usbListDevicesStub.restore()
      })

      it('should resolve an empty array', function () {
        return usbboot.scan().then((devices) => {
          m.chai.expect(devices).to.deep.equal([])
        })
      })
    })

    describe('given a supported and a non supported device', function () {
      beforeEach(function () {
        this.usbListDevicesStub = m.sinon.stub(usb, 'listDevices')
        this.usbListDevicesStub.returns(Bluebird.resolve([
          BCM2835_STUB,
          UNSUPPORTED_DEVICE_STUB
        ]))
      })

      afterEach(function () {
        this.usbListDevicesStub.restore()
      })

      it('should only resolve the supported device', function () {
        return usbboot.scan().then((devices) => {
          m.chai.expect(devices.length).to.equal(1)
          const device = _.first(devices)
          m.chai.expect(device.name).to.equal('Broadcom BCM2708 Boot')
        })
      })
    })

    describe('given a BCM2835 device', function () {
      beforeEach(function () {
        this.usbListDevicesStub = m.sinon.stub(usb, 'listDevices')
        this.usbListDevicesStub.returns(Bluebird.resolve([
          BCM2835_STUB
        ]))
      })

      afterEach(function () {
        this.usbListDevicesStub.restore()
      })

      it('should resolve a friendly device object', function () {
        return usbboot.scan().then((devices) => {
          m.chai.expect(devices.length).to.equal(1)
          const device = _.first(devices)
          m.chai.expect(device.name).to.equal('Broadcom BCM2708 Boot')
          m.chai.expect(device.interface).to.equal(0)
          m.chai.expect(device.outEndpoint).to.equal(1)
          m.chai.expect(device.instance).to.deep.equal(BCM2835_STUB)
        })
      })
    })

    describe('given a BCM2837 device', function () {
      beforeEach(function () {
        this.usbListDevicesStub = m.sinon.stub(usb, 'listDevices')
        this.usbListDevicesStub.returns(Bluebird.resolve([
          BCM2837_STUB
        ]))
      })

      afterEach(function () {
        this.usbListDevicesStub.restore()
      })

      it('should resolve a friendly device object', function () {
        return usbboot.scan().then((devices) => {
          m.chai.expect(devices.length).to.equal(1)
          const device = _.first(devices)
          m.chai.expect(device.name).to.equal('Broadcom BCM2710 Boot')
          m.chai.expect(device.interface).to.equal(0)
          m.chai.expect(device.outEndpoint).to.equal(1)
          m.chai.expect(device.instance).to.deep.equal(BCM2837_STUB)
        })
      })
    })
  })
})
