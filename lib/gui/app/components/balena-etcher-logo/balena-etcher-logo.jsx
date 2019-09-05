'use strict'

// eslint-disable-next-line no-unused-vars
const React = require('react')
const { open } = require('../../os/open-external/services/open-external')
const SvgIcon = require('../svg-icon/svg-icon.jsx')
const {
  default: styled
} = require('styled-components')

const CenteredDiv = styled.div `
  position: absolute;
  left: 50%;
  top: 1.5em;
  transform: translate(-50%, -50%);

  > img {
    cursor: pointer;
  }
`

const BalenaEtcherLogo = () => {
  return (
    <CenteredDiv
      onClick={open.bind(null, 'https://www.balena.io?ref=etcher')}
    >
      <SvgIcon
        paths={[ '../../assets/etcher.svg' ]}
        width='114px'
        height='20px'
      >
      </SvgIcon>
    </CenteredDiv>
  )
}

module.exports = BalenaEtcherLogo
