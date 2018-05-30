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

const _ = require('lodash')
const fs = require('fs')
const path = require('path')
const React = require('react')
const propTypes = require('prop-types')
const { default: styled } = require('styled-components')
const rendition = require('rendition')
const prettyBytes = require('pretty-bytes')
const Bluebird = require('bluebird')
const fontAwesome = require('@fortawesome/fontawesome')
const {
  faFileAlt,
  faFolder,
  faAngleLeft,
  faHdd
} = require('@fortawesome/fontawesome-free-solid')
const Storage = require('../../../models/storage')
const analytics = require('../../../modules/analytics')
const middleEllipsis = require('../../../utils/middle-ellipsis')
const files = require('../../../models/files')
const selectionState = require('../../../models/selection-state')
const imageStream = require('../../../../../sdk/image-stream')
const errors = require('../../../../../shared/errors')
const messages = require('../../../../../shared/messages')
const supportedFormats = require('../../../../../shared/supported-formats')

/**
 * @summary Recent files localStorage object key
 * @constant
 * @private
 */
const RECENT_FILES_KEY = 'file-selector-recent-files'
const recentStorage = new Storage(RECENT_FILES_KEY)

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
const FILENAME_CHAR_LIMIT = 20

/**
 * @summary Character limit of a filename before a middle-ellipsis is added
 * @constant
 * @private
 */
const FILENAME_CHAR_LIMIT_SHORT = 15

/**
 * @summary Color scheme
 * @constant
 * @private
 */
const colors = {
  primary: {
    color: '#3a3c41',
    background: '#ffffff',
    subColor: '#ababab'
  },
  secondary: {
    color: '#1c1d1e',
    background: '#ebeff4',
    title: '#b3b6b9'
  },
  highlight: {
    color: 'white',
    background: '#2297de'
  },
  soft: {
    color: '#4d5056'
  }
}

/**
 * @summary Awesome icons HTML object
 * @constant
 * @type {Object<HTMLElement>}
 */
const icons = {
  faFileAlt: fontAwesome.icon(faFileAlt).html[0],
  faFolder: fontAwesome.icon(faFolder).html[0],
  faAngleLeft: fontAwesome.icon(faAngleLeft).html[0],
  faHdd: fontAwesome.icon(faHdd).html[0]
}

/**
 * @summary Icon React component
 * @class
 * @type {ReactElement}
 */
class UnstyledIcon extends React.PureComponent {
  render () {
    const { type, ...restProps } = this.props

    return (
      <span className={ this.props.className } dangerouslySetInnerHTML={ { __html: icons[type] } } { ...restProps } />
    )
  }
}

/**
 * @summary Icon Styled component
 * @function
 * @type {StyledComponent}
 */
const Icon = styled(UnstyledIcon)`
  color: ${props => props.color};
  font-size: ${props => props.size};
`

/**
 * @summary Flex styled component
 * @function
 * @type {ReactElement}
 */
const Flex = styled.div`
  display: flex;
  flex: ${ props => props.flex };
  flex-direction: ${ props => props.direction };
  justify-content: ${ props => props.justifyContent };
  align-items: ${ props => props.alignItems };
  flex-wrap: ${ props => props.wrap };
  flex-grow: ${ props => props.grow };
`

class UnstyledFileLink extends React.PureComponent {
  constructor (props) {
    super(props)

    this.highlightFile = this.highlightFile.bind(this)
    this.selectFile = this.selectFile.bind(this)
  }

  render () {
    const icon = this.props.file.isDirectory ? 'faFolder' : 'faFileAlt'

    return (
      <Flex
        direction="column"
        alignItems="stretch"
        className={ this.props.className }
        onClick={ this.highlightFile }
        onDoubleClick={ this.selectFile }>
        <Icon type={ icon } size="48px" />
        <span>
          { middleEllipsis(this.props.file.basename || '', FILENAME_CHAR_LIMIT_SHORT) }
        </span>
        <div>{ prettyBytes(this.props.file.size || 0) }</div>
      </Flex>
    )
  }

  highlightFile () {
    this.props.highlightFile(this.props.file)
  }

  selectFile () {
    this.props.selectFile(this.props.file)
  }
}

const FileLink = styled(UnstyledFileLink)`
  width: 100px;
  max-height: 128px;
  margin: 5px 10px;
  padding: 5px;
  background-color: ${ props => props.highlight ? colors.highlight.background : 'none' };
  transition: 0.15s background-color ease-out;
  color: ${ props => props.highlight ? colors.highlight.color : colors.primary.color };
  cursor: pointer;
  border-radius: 5px;

  > span:first-of-type {
    align-self: center;
    line-height: 1;
    margin-bottom: 6px;
    color: ${ props => props.highlight ? colors.highlight.color : colors.soft.color }
  }

  > span:last-of-type {
    display: flex;
    justify-content: center;
    text-align: center;
    word-break: break-all;
    font-size: 16px;
  }

  > div:last-child {
    background-color: ${ props => props.highlight ? colors.highlight.background : 'none' }
    color: ${ props => props.highlight ? colors.highlight.color : colors.primary.subColor }
    text-align: center;
    font-size: 12px;
  }
`

const Header = Flex.extend`
  margin: 10px 15px 0;

  > * {
    margin: 5px;
  }
`

const Main = Flex.extend``

const Footer = Flex.extend`
  margin: 10px 20px;
  flex: 0 0 auto;

  > * {
    margin: 0 10px;
  }
`

class UnstyledFileListWrap extends React.PureComponent {
  constructor (props) {
    super(props)

    this.scrollElem = null

    this.setScrollElem = this.setScrollElem.bind(this)
  }

  render () {
    return (
      <Flex
        className={ this.props.className }
        innerRef={ this.setScrollElem }
        wrap="wrap"
      >
        { this.props.children }
      </Flex>
    )
  }

  setScrollElem (scrollElem) {
    this.scrollElem = scrollElem
  }

  componentDidUpdate (prevProps) {
    if (prevProps.path !== this.props.path && this.scrollElem) {
      this.scrollElem.scrollTop = 0
    }
  }
}

const FileListWrap = styled(UnstyledFileListWrap)`
  overflow-x: hidden;
  overflow-y: auto;
  padding: 0 20px;
`

class RecentFileLink extends React.PureComponent {
  constructor (props) {
    super(props)

    this.select = this.select.bind(this)
  }

  render () {
    return (
      <rendition.Button
        onClick={ this.select }
        plaintext={ true }>
        { middleEllipsis(path.basename(this.props.title), FILENAME_CHAR_LIMIT_SHORT) }
      </rendition.Button>
    )
  }

  select () {
    files.getFileMetadataAsync(this.props.fullpath).then(this.props.selectFile)
  }
}

class RecentFilesUnstyled extends React.PureComponent {
  constructor (props) {
    super(props)

    this.state = {
      recents: recentStorage.get('recents', []),
      favorites: recentStorage.get('favorites', [])
    }
  }

  render () {
    return (
      <Flex className={ this.props.className }>
        <h5>Recent</h5>
        {
          _.map(this.state.recents, (file) => {
            return (
              <RecentFileLink
                key={ file.dirname }
                fullpath={ file.dirname }
                title={ path.basename(file.dirname) }
                selectFile={ this.props.selectFile }
              />
            )
          })
        }
        <h5>Favorite</h5>
        {
          _.map(this.state.favorites.slice(0, 4), (file) => {
            return (
              <RecentFileLink
                key={ file.fullpath }
                fullpath={ file.fullpath }
                title={ file.basename }
                selectFile={ this.props.selectFile }
              />
            )
          })
        }
      </Flex>
    )
  }

  componentWillMount () {
    window.addEventListener('storage', this.onStorage)
  }

  componentWillUnmount () {
    window.removeEventListener('storage', this.onStorage)
  }

  componentDidMount () {
    Bluebird.reduce(this.state.recents, (newRecents, recent) => {
      return files.existsAsync(recent.fullpath).then((exists) => {
        if (exists) {
          return newRecents.concat(recent)
        }

        return newRecents
      })
    }, []).then((recents) => {
      this.setState({ recents })
    })

    Bluebird.reduce(this.state.favorites, (newFavorites, favorite) => {
      return files.existsAsync(favorite.fullpath).then((exists) => {
        if (exists) {
          return newFavorites.concat(favorite)
        }

        return newFavorites
      })
    }, []).then((favorites) => {
      this.setState({ favorites })
    })
  }

  onStorage (event) {
    if (event.key === RECENT_FILES_KEY) {
      this.setState(event.newValue)
    }
  }
}

const RecentFiles = styled(RecentFilesUnstyled)`
  display: flex;
  flex: 0 0 auto;
  flex-direction: column;
  align-items: flex-start;
  width: 130px;
  background-color: ${ colors.secondary.background };
  padding: 20px;
  color: ${ colors.secondary.color };

  > h5 {
    color: ${ colors.secondary.title };
    font-size: 11px;
    font-weight: 500;
    text-transform: uppercase;
    margin-bottom: 15px;
  }

  > h5:last-of-type {
    margin-top: 20px;
  }

  > button {
    margin-bottom: 10px;
    text-align: start;
    font-size: 16px;
  }
`

const labels = {
  '/': 'Root',
  'mountpoints': 'Mountpoints'
}

class Crumb extends React.PureComponent {
  constructor (props) {
    super(props)

    this.selectFile = this.selectFile.bind(this)
  }

  render () {
    return (
      <rendition.Button
        onClick={ this.selectFile }
        plaintext={ true }>
        <rendition.Txt bold={ this.props.bold }>
          { middleEllipsis(labels[this.props.dir.fullpath] || this.props.dir.basename, FILENAME_CHAR_LIMIT_SHORT) }
        </rendition.Txt>
      </rendition.Button>
    )
  }

  selectFile () {
    this.props.selectFile(this.props.dir)
  }
}

class UnstyledBreadcrumbs extends React.PureComponent {
  render () {
    const folderConstraints = this.props.constraints.length
      ? this.props.constraints
      : [ path.parse(this.props.path).root ]

    const dirs = files.subpaths(this.props.path).filter((subpath) => {
      // Guard against displaying folders outside the constrained folders
      return folderConstraints.some((folderConstraint) => {
        return !path.relative(folderConstraint, subpath.fullpath).startsWith('..')
      })
    })

    return (
      <div className={ this.props.className }>
        { dirs.length > MAX_DIR_CRUMBS ? '... / ' : null }
        {
          _.map(dirs.slice(-MAX_DIR_CRUMBS), (dir, index) => {
            return (
              <Crumb
                key={ dir.fullpath }
                bold={ index === dirs.length - 1 }
                dir={ dir }
                selectFile={ this.props.selectFile }
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

class FileSelector extends React.PureComponent {
  constructor (props) {
    super(props)

    this.state = {
      path: props.path,
      files: [],
      history: [],
      highlighted: null,
      error: null
    }

    // Filters schema
    this.schema = {
      type: 'object',
      properties: {
        basename: {
          type: 'string'
        },
        isHidden: {
          type: 'boolean'
        },
        isDirectory: {
          type: 'boolean'
        }
      }
    }

    this.closeModal = this.closeModal.bind(this)
    this.resolveModal = this.resolveModal.bind(this)
    this.browsePath = this.browsePath.bind(this)
    this.selectFile = this.selectFile.bind(this)
    this.highlightFile = this.highlightFile.bind(this)
    this.previousDirectory = this.previousDirectory.bind(this)
  }

  render () {
    const items = this.state.files

    const styles = {
      display: 'flex',
      height: 'calc(100vh - 20px)',
    }

    const errorModal = (
      <rendition.Modal
        title={ _.get(this.state.error, [ 'title' ]) || "Error" }
        done={ () => this.setState({ error: null }) }
        action="Dismiss"
        primaryButtonProps={ { danger: true, primary: false } }
      >
        { _.get(this.state.error, [ 'message' ]) || this.state.error }
      </rendition.Modal>
    )

    return (
      <rendition.Provider
        style={ styles }>
        <RecentFiles selectFile={ this.selectFile } flex="0 0 auto" />
        <Flex direction="column" grow="1">
          <Header flex="0 0 auto" alignItems="baseline">
            <rendition.Button
              bg={ colors.secondary.background }
              color={ colors.primary.color }
              disabled={ !this.state.history.length }
              onClick={ this.previousDirectory }>
              <Icon type={ 'faAngleLeft' } />
              &nbsp;Back
            </rendition.Button>
            <Icon type={ 'faHdd' } />
            <Breadcrumbs
              path={ this.state.path }
              selectFile={ this.selectFile }
              constraints={ this.props.constraints }
            />
          </Header>
          <Main flex="1">
            <Flex direction="column" grow="1">
              <FileListWrap path={ this.state.path }>
                {
                  items.map((item) => {
                    return (
                      <FileLink
                        key={ item.fullpath }
                        file={ item }
                        highlight={ _.get(this.state.highlighted, 'fullpath') === _.get(item, 'fullpath') }
                        highlightFile={ this.highlightFile }
                        selectFile={ this.selectFile }
                      />
                    )
                  })
                }
              </FileListWrap>
            </Flex>
          </Main>
          <Footer justifyContent="flex-end">
            <rendition.Button onClick={ this.closeModal }>Cancel</rendition.Button>
            <rendition.Button
              primary
              onClick={ this.resolveModal }
              disabled={ !this.state.highlighted }>
              Select file
            </rendition.Button>
          </Footer>
        </Flex>
        { this.state.error ? errorModal : null }
      </rendition.Provider>
    )
  }

  componentDidMount () {
    this.setFilesProgressively(this.state.path)
  }

  closeModal () {
    this.props.close()
  }

  resolveModal () {
    this.selectFile(this.state.highlighted)
  }

  setFilesProgressively (dirname) {
    return fs.readdirAsync(dirname).then((basenames) => {
      return files.getAllFilesMetadataAsync(dirname, basenames)
    }).then((fileObjs) => {
      // Sort folders first and ignore case
      fileObjs.sort((fileA, fileB) => {
        // NOTE(Shou): the multiplication is an arbitrarily large enough number
        // to ensure folders have precedence over filenames
        const directoryPrecedence = (-Number(fileA.isDirectory) + Number(fileB.isDirectory)) * 3
        return directoryPrecedence + fileA.basename.localeCompare(fileB.basename, undefined, { sensitivity: 'base' })
      })
      this.setState({ files: fileObjs })
    })
  }

  browsePath (file) {
    analytics.logEvent('File browse', _.omit(file, [
      'fullpath',
      'basename',
      'dirname'
    ]))

    const folderConstraints = this.props.constraints.length
      ? this.props.constraints
      : [ path.parse(this.props.path).root ]

    // Guard against browsing outside the constrained folder
    const isWithinAnyConstraint = folderConstraints.some((folderConstraint) => {
      return !path.relative(folderConstraint, file.fullpath).startsWith('..')
    })
    if (!isWithinAnyConstraint) {
      const error = `Cannot browse outside constrained folders ${folderConstraints}`
      analytics.logException(new Error(error))
      this.setState({ error })
      return
    }

    this.setFilesProgressively(file.fullpath).then(() => {
      this.setState({ path: file.fullpath })
    }).catch((error) => {
      this.setState({ error: error.message })
    })
  }

  selectFile (file, event) {
    if (file === null) {
      analytics.logEvent('File dismiss', null)
    } else if (file.isDirectory) {
      const prevFile = files.getFileMetadataSync(this.state.path)
      this.setState({
        history: this.state.history.concat(prevFile)
      })
      this.browsePath(file)
    } else {
      analytics.logEvent('File select', file.basename)

      imageStream.getImageMetadata(file.fullpath)
        .then((image) => {
          if (!supportedFormats.isSupportedImage(image.path)) {
            const invalidImageError = errors.createUserError({
              title: 'Invalid image',
              description: messages.error.invalidImage(image)
            })

            this.setState({ error: invalidImageError })
            analytics.logEvent('Invalid image', image)
            return
          }

          return Bluebird.try(() => {
            let message = null

            if (supportedFormats.looksLikeWindowsImage(image.path)) {
              analytics.logEvent('Possibly Windows image', image)
              message = messages.warning.looksLikeWindowsImage()
            } else if (!image.hasMBR) {
              analytics.logEvent('Missing partition table', image)
              message = messages.warning.missingPartitionTable()
            }

            if (message) {
              // TODO(Shou): `Continue` should be on a red background (dangerous action) instead of `Change`.
              // We want `X` to act as `Continue`, that's why `Continue` is the `rejectionLabel`
              this.setState({ error: message })
              return
            }

            return image
          }).then((image) => {
            if (image) {
              selectionState.selectImage(image)
            }
          })
        })
        .catch((error) => {
          const imageError = errors.createUserError({
            title: 'Error opening image',
            description: messages.error.openImage(file.basename, error.message)
          })

          this.setState({ error: imageError })
          analytics.logException(error)
        })

      // Add folder to recently used
      recentStorage.modify('recents', (recents) => {
        const newRecents = _.uniqBy([ file ].concat(recents), (recentFile) => {
          return recentFile.dirname
        })

        // NOTE(Shou): we want to limit how many recent directories are stored - since we only
        // display four and don't rely on past state, we can only store four
        return newRecents.slice(0, 4)
      }, [])

      // Add file to potential favorites list
      recentStorage.modify('favorites', (favorites) => {
        const favorite = _.find(favorites, (favoriteFile) => {
          return favoriteFile.fullpath === file.fullpath
        }) || _.assign({}, file, { frequency: 1 })

        const newFavorites = _.uniqBy([ favorite ].concat(favorites), (favoriteFile) => {
          return favoriteFile.fullpath
        })

        // NOTE(Shou): we want to limit how many favorite files are stored - since we
        // *do* rely on past state, we need to store a reasonable amount of favorites so
        // they can be sorted by frequency. We only display four.
        return newFavorites.slice(0, 256)
      }, [])

      this.closeModal()
    }
  }

  highlightFile (file) {
    this.setState({ highlighted: file })
  }

  previousDirectory () {
    analytics.logEvent('Prev directory', null)
    const dir = this.state.history.shift()
    this.setState({ history: this.state.history })

    if (dir) {
      this.browsePath(dir)
    }
  }
}

FileSelector.propTypes = {
  path: propTypes.string,

  close: propTypes.func,

  constraints: propTypes.arrayOf(propTypes.string)
}

module.exports = FileSelector
