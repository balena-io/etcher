
'use strict'

const _ = require('lodash')
const m = require('mochainon')
const path = require('path')
const webpackConfig = require('../../webpack.config.js')

// eslint-disable-next-line
__dirname = path.join(__dirname, '..', '..')

describe('Webpack config', function () {
  describe('Externals', function () {
    const [ exclude ] = webpackConfig.externals

    it('should exclude the SDK folder from the bundle', function () {
      const request = path.join(__dirname, 'lib', 'sdk')

      // eslint-disable-next-line handle-callback-err
      exclude('', request, (error, newRequest) => {
        m.chai.expect(newRequest).to.equal(`commonjs ${path.join('..', '..', '..', 'lib', 'sdk')}`)
      })
    })

    it('should exclude the shared folder from the bundle', function () {
      const request = path.join(__dirname, 'lib', 'shared')

      // eslint-disable-next-line handle-callback-err
      exclude('', request, (error, newRequest) => {
        m.chai.expect(newRequest).to.equal(`commonjs ${path.join('..', '..', '..', 'lib', 'shared')}`)
      })
    })

    it('should exclude package.json from the bundle', function () {
      const request = path.join(__dirname, 'package.json')

      // eslint-disable-next-line handle-callback-err
      exclude('', request, (error, newRequest) => {
        m.chai.expect(newRequest).to.equal(`commonjs ${path.join('..', '..', '..', 'package.json')}`)
      })
    })

    it('should include everything else', function () {
      const files = [
        path.join('gui', 'etcher.js'),
        path.join('gui', 'menu.js'),
        path.join('gui', 'modules', 'child-writer.js')
      ]

      _.forEach(files, (file) => {
        const request = path.join(__dirname, file)

        // eslint-disable-next-line handle-callback-err
        exclude('', request, (error, newRequest) => {
          m.chai.expect(newRequest).to.be.undefined
        })
      })
    })
  })
})
