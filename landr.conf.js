const prepAssets = require('./www/prepAssets')

module.exports = {
  theme: 'landr-theme-basic',
  middleware: (store, action, next) => {
    if (action.type === 'ADD_RELEASE') {
      // intercept all releases and add pretty labels to assets
      action.payload = prepAssets(action.payload)
    }
    return next(action)
  },
  settings: {
    analytics: {
      mixpanelToken: '9d6bc43e4d64eb3bd64922c969e2955f',
      gosquaredId: 'GSN-954701-N',
      gaSite: 'etcher.io',
      gaId: 'UA-45671959-2'
    },
    theme: {
      colors: {
        primary: '#1496E1'
      }
    },
    lead: 'Burn. Better.',
    features: [
      {
        'title': 'Validated Burning',
        'image': 'sd.png',
        'description': 'No more writing images on corrupted cards and wondering why your device isn\'t booting.'
      },
      {
        'title': 'Hard Drive Friendly',
        'image': 'hd.png',
        'description': 'Makes drive selection obvious to avoid wiping your entire hard-drive'
      },
      {
        'title': 'Beautiful Interface',
        'image': 'simple.png',
        'description': 'Who said burning SD cards has to be an eyesore.'
      },
      {
        'title': 'Open Source',
        'image': 'open-source.png',
        'description': 'Made with JS, HTML, node.js and <a target="_blank" href="http://electron.atom.io/">Electron</a>. Dive in and contribute!'
      },
      {
        'title': 'Cross Platform',
        'image': 'cross-platform.png',
        'description': 'Works for everyone,<br/>no more complicated install instructions.'
      },
      {
        'title': 'More on the way',
        'image': 'coming-soon.png',
        'description': '50% faster burns, simultaneous writing for multiple drives.<br/><a target="_blank" href="https://github.com/resin-io/etcher/milestones">View our roadmap</a>'
      }
    ],
    motivation: [
      'Here at <a target="_blank" href="https://resin.io">resin.io</a> we have thousands of users working through our getting started process and until recently we were embarassed about the steps that involved burning an SD card. There was a separate track for each Mac/Windows/Linux and several manual and error-prone steps along the way.',
      'To our surprise there was nothing out there that fitted our needs. So we built Etcher, a SD card burner app that is simple for end users, extensible for developers, and works on any platform. '
    ],
  }
}
