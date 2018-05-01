'use strict'

const _ = require('lodash')
const nodeIpc = require('node-ipc')

/**
 * @summary Mocked IPC socket
 * @class
 * @private
 *
 * @example
 * new MockSocket()
 */
class MockSocket {
  /**
   * @summary Constructor
   *
   * @example
   * new MockSocket()
   */
  constructor () {
    this.destroyed = false
  }

  /**
   * @summary Destroy the socket
   * @function
   * @public
   *
   * @example
   * const mockSocket = new MockSocket()
   * mockSocket.destroy()
   */
  destroy () {
    this.destroyed = true
  }
}

/**
 * @summary Mocked IPC class
 * @class
 * @public
 *
 * @example
 * new MockIPC()
 */
class MockIPC {
  /**
   * @summary Constructor
   *
   * @example
   * new MockIPC()
   */
  constructor () {
    this.mockEvents = {}
    this.config = {}
    this.server = false
  }

  /**
   * @summary Mock receiving data from the server
   * @function
   * @public
   *
   * @param {String} event - event string
   * @param {any} data - any data
   *
   * @example
   * emitFromServer('progress', 56)
   */
  emitFromServer (event, data) {
    _.map(_.get(this, [ 'mockEvents', event ], []), (eventFunction) => {
      eventFunction(data)
    })
  }

  /**
   * @summary ipc.serve mock
   * @function
   * @public
   *
   * @example
   * mockedIpc.serve()
   */
  serve () {
    this.server = {
      stop: this.serverStop.bind(this),
      on: this.serverOn.bind(this),
      start: this.serverStart.bind(this),
      emit: this.serverEmit.bind(this),
      sockets: [
        new MockSocket()
      ],
      mockStopCalled: false,
      mockEmissions: {}
    }
  }

  /**
   * @summary ipc.server.on mock
   * @function
   * @public
   *
   * @param {String} event - event string
   * @param {Function} eventFunction - event function
   *
   * @example
   * mockedIpc.server.on
   */
  serverOn (event, eventFunction) {
    this.mockEvents[event] = (this.mockEvents[event] || []).concat(eventFunction)
  }

  /**
   * @summary ipc.server.start mock
   * @function
   * @public
   *
   * @example
   * mockedIpc.server.start()
   */
  serverStart () {
    this.emitFromServer('start')
  }

  /**
   * @summary ipc.server.stop mock
   * @function
   * @public
   *
   * @example
   * mockedIpc.server.stop()
   */
  serverStop () {
    this.server.mockStopCalled = true
  }

  /**
   * @summary ipc.server.emit mock
   * @function
   * @public
   *
   * @param {Socket} socket - socket
   * @param {String} event - event string
   * @param {any} data - data to send
   *
   * @example
   * mockedIpc.server.emit(socket, 'write', optionsObject)
   */
  serverEmit (socket, event, data) {
    this.server.mockEmissions[event] = (this.server.mockEmissions[event] || []).concat(data)
  }
}

if (process.env.ETCHER_TEST) {
  module.exports = new MockIPC()
} else {
  module.exports = nodeIpc
}
