const _ = require('lodash')
const usbboot = require('./lib/shared/sdk/usbboot')
const usb = require('usb')
const fs = require('fs')

usbboot.scan().then((devices) => {
  console.log(devices[0].instance)
  return usbboot.flash(_.first(devices), {
    files: {
      'bootcode.bin': fs.readFileSync('../usbboot/msd/bootcode.bin'),
      'start.elf': fs.readFileSync('../usbboot/msd/start.elf')
    }
  })
}).then(() => {
  console.log('Done')
}).catch((error) => {
  console.log('There was an error')
  console.error(error)
  console.error(error.stack)
  console.error(error.stacktrace)

  setTimeout(() => {
    process.exit(1)
  }, 500)
})
