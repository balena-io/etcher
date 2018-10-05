const EventEmitter = require('events')
const i2c = require('i2c-bus')
const { Pca9685Driver } = require('pca9685')
const debug = require('debug')('etcher:blinkenlights')

class BlinkenLights extends EventEmitter {

  constructor(options) {
    super(options)
    this.driver = null
    this.bus = null
    this.options = Object.assign({}, BlinkenLights.defaults, options)
  }

  init(options, callback) {
    this.options = options || this.options

    if (this.bus || this.driver) {
      callback(new Error('Already initialized I2C bus or Pca9685 driver'))
      return
    }

    this.bus = i2c.open(this.options.i2cBus, (error) => {
      debug('i2c:init', error || 'OK')
      if (error) {
        this.destroy(error, callback)
        return
      }
      this.driver = new Pca9685Driver({
        i2cBus: this.bus
      }, (error) => {
        debug('pca9685:init', error || 'OK')
        if (error) {
          this.destroy(error, callback)
          return
        }
        this.driver = driver
        callback.call(this)
      })
    })
  }

  close(callback) {
    if (this.driver) {
      this.driver.close((driverError) => {
        this.bus.close((busError) => {
          callback.call(this, driverError || busError)
        })
      })
    } else if (this.bus) {
      this.bus.close((error) => {
        callback.call(this, error)
      })
    } else {
      callback.call(this)
    }
  }

  destroy(error, callback) {
    this.close(() => {
      callback.call(this, error)
    })
  }

}

BlinkenLights.defaults = {
  i2cBus: 1,
  address: 0x40,
  frequency: 50,
  debug: false,
}

module.exports = BlinkenLights
