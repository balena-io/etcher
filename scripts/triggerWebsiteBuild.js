'use strict';
const request = require('request');

const options = {
  url: 'https://api.travis-ci.org/repo/resin-io%2Fetcher-homepage/requests',
  method: 'POST',
  headers: {
    'Accept': 'application/json',
    'Travis-API-Version': '3',
    'Authorization': 'token ' + process.env.TRAVIS_API_TOKEN
  },
  body: {
    request: {
      message: 'Trigger build at resin/etcher-homepage',
      branch: 'master'
    }
  },
  json: true
};

const callback = function(error, response) {
  if (!error && response.statusCode === 202) {
    console.log('Triggered website build');
  } else {
    console.log('Error', error);
    process.exit(-1);
  }
};

request(options, callback);
