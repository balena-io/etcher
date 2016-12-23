'use strict';
const packageJSON = require('json-loader!./package.json');
const logo = require('www/images/logo.png');
const README = require('readme?delimiterTag=h2!./README.md');
const _ = require('lodash');

// grab the handlebar templates
const head = require('head');
const jumbotron = require('jumbotron');
const grid = require('grid');
const navbar = require('navbar');
const section = require('section');
const table = require('table');
const footer = require('footer');
const info = require('info');

// partials
const ghStarBtn = require('partials/github-star');
const btn = require('partials/button');
const link = require('partials/link');
const tweet = require('partials/btn-tweet');

// scripts
const gaScript = require('scripts/ga');
const go4SquaredScript = require('scripts/go4squared');
const typekitScript = require('scripts/typekit');
const githubButtonScript = require('scripts/github-buttons');

const features = [
  {
    title: 'Validated Burning',
    lead: 'No more writing images on corrupted cards and wondering why your device isn\'t booting.',
    image: require('www/images/validated-burning.png')
  },
  {
    title: 'Hard Drive Friendly',
    lead: 'Makes drive selection obvious to avoid wiping your entire hard-drive',
    image: require('www/images/hard-drive.png')
  },
  {
    title: 'Open Source',
    lead: 'Made with JS, HTML, node.js and Electron. Dive in and contribute!',
    image: require('www/images/open-source.png')
  },
  {
    title: 'Cross Platform',
    lead: 'Works for everyone,</br> no more complicated install instructions.',
    image: require('www/images/x-platform.png')
  },
  {
    title: 'Beautiful Interface',
    lead: 'Who said burning SD cards has to be an eyesore.',
    image: require('www/images/simple.png')
  },
  {
    title: 'More on the way',
    lead: `50% faster burns, simultaneous writing for multiple drives. View our ${link({
      text: 'roadmap',
      href: `${packageJSON.homepage}/milestones`,
      class: 'text-white',
      target: '_blank'
    })}`,
    image: require('www/images/feature.png')
  }
];

const navLinks = [
  {
    text: 'Chat on gitter',
    href: 'https://gitter.im/resin-io/etcher'
  },
  {
    text: 'Repository',
    href: packageJSON.homepage
  },
  ghStarBtn({
    user: 'resin-io',
    repo: 'etcher'
  })
];

const baseURL = 'https://resin-production-downloads.s3.amazonaws.com/etcher/';

const downloads = [
  {
    Release: `${baseURL}${packageJSON.version}/Etcher-${packageJSON.version}-win32-x64.exe`,
    OS: 'Windows',
    Architecture: 'x64 (64-bit)'
  },
  {
    Release: `${baseURL}${packageJSON.version}/Etcher-${packageJSON.version}-win32-x64.zip`,
    OS: 'Windows',
    Architecture: 'x64 (64-bit)'
  },
  {
    Release: `${baseURL}${packageJSON.version}/Etcher-${packageJSON.version}-win32-x86.exe`,
    OS: 'Windows',
    Architecture: 'x86 (32-bit)'
  },
  {
    Release: `${baseURL}${packageJSON.version}/Etcher-${packageJSON.version}-win32-x86.zip`,
    OS: 'Windows',
    Architecture: 'x86 (32-bit)'
  },
  {
    Release: `${baseURL}${packageJSON.version}/Etcher-${packageJSON.version}-darwin-x64.dmg`,
    OS: 'OS X',
    Architecture: 'x64 (64-bit)'
  },
  {
    Release: `${baseURL}${packageJSON.version}/Etcher-${packageJSON.version}-linux-x64.zip`,
    OS: 'Linux',
    Architecture: 'x64 (64-bit)'
  },
  {
    Release: `${baseURL}${packageJSON.version}/Etcher-${packageJSON.version}-linux-x86.zip`,
    OS: 'Linux',
    Architecture: 'x86 (32-bit)'
  }
];

const story = _.find(README.sections, [ 'title', 'Why Etcher' ]);

// Util classes
// http://v4-alpha.getbootstrap.com/utilities/spacing/

const blocks = [
  head({
    title: README.title,
    url: 'http://etcher.io',
    lead: README.lead,
    image: README.screenshot,
    favicon: require('www/images/etcher.ico')
  }),
  navbar({
    image: logo,
    items: navLinks,
    class: 'py-1 bg-inverse navbar-dark'
  }),
  jumbotron({
    title: 'Burn. Better.',
    lead: README.lead,
    image: README.screenshot,
    meta: `Latest version: ${packageJSON.version}`,
    description: btn({
      title: `Try ${README.title}`,
      href: '#downloads',
      class: 'btn-primary btn-lg'
    }),
    class: 'py-3 m-0 text-xs-center bg-inverse text-white'
  }),
  grid({
    title: 'Features',
    lead: README.description,
    items: features,
    itemsPerRow: 3,
    class: 'py-3 text-white bg-primary'
  }),
  info({
    title: `Version <code>${packageJSON.version}</code> is out, spread the good news!&nbsp;&nbsp;${tweet({
      text: 'Meet Etcher by @resin_io an awesome new way to write SD cards. Give it a shot and you\'ll never go back!',
      url: 'https://etcher.io',
      size: 'small'
    })}`,
    class: 'pt-1 text-xs-center bg-faded'
  }),
  section({
    title: story.title,
    content: story.content,
    class: 'py-3 bg-inverse text-white'
  }),
  table({
    id: 'downloads',
    title: 'Downloads',
    lead: `Latest version: ${packageJSON.version}`,
    data: downloads,
    class: 'py-3'
  }),
  footer({
    image: logo,
    meta: `Etcher is an open source project by ${link({
      text: 'resin.io',
      href: 'https://resin.io',
      class: 'text-white',
      target: '_blank'
    })} - Modern DevOps for the Industrial Internet of Things`,
    items: navLinks,
    class: 'py-3 bg-inverse text-white'
  }),
  gaScript({
    token: 'UA-45671959-2'
  }),
  go4SquaredScript({
    token: 'GSN-954701-N'
  }),
  typekitScript({
    token: 'lzw7tre'
  }),
  githubButtonScript()
];

module.exports = blocks.join('');
