/*
 * Copyright 2018 resin.io
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

const path = require('path')

const React = require('react')
const propTypes = require('prop-types')
const styled = require('styled-components').default
const rendition = require('rendition')

const middleEllipsis = require('../../../utils/middle-ellipsis')

/**
 * @summary How many directories to show with the breadcrumbs
 * @type {Number}
 * @constant
 * @private
 */
const MAX_DIR_CRUMBS = 3

/**
 * @summary Character limit of a filename before a middle-ellipsis is added
 * @constant
 * @private
 */
const FILENAME_CHAR_LIMIT_SHORT = 15

function splitComponents(dirname, root) {
  const components = []
  let basename = null
  root = root || path.parse(dirname).root
  while( dirname !== root ) {
    basename = path.basename(dirname)
    components.unshift({
      path: dirname,
      basename: basename,
      name: basename
    })
    dirname = path.join( dirname, '..' )
  }
  if (components.length < MAX_DIR_CRUMBS) {
    components.unshift({
      path: root,
      basename: root,
      name: 'Root'
    })
  }
  return components
}

class Crumb extends React.PureComponent {
  constructor (props) {
    super(props)
  }

  render () {
    return (
      <rendition.Button
        onClick={ ::this.navigate }
        plain={ true }>
        <rendition.Txt bold={ this.props.bold }>
          { middleEllipsis(this.props.dir.name, FILENAME_CHAR_LIMIT_SHORT) }
        </rendition.Txt>
      </rendition.Button>
    )
  }

  navigate () {
    this.props.navigate(this.props.dir.path)
  }
}

class UnstyledBreadcrumbs extends React.PureComponent {
  render () {
    const components = splitComponents(this.props.path).slice(-MAX_DIR_CRUMBS)
    return (
      <div className={ this.props.className }>
      {
        components.map((dir, index) => {
          return (
            <Crumb
              key={ dir.path }
              bold={ index === components.length - 1 }
              dir={ dir }
              navigate={ ::this.props.navigate }
            />
          )
        })
      }
      </div>
    )
  }
}

const Breadcrumbs = styled(UnstyledBreadcrumbs)`
  font-size: 18px;

  & > button:not(:last-child)::after {
    content: '/';
    margin: 9px;
  }
`

module.exports = Breadcrumbs
