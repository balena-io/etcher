'use strict';
const _ = require('lodash');
const platform = require('platform');
const $ = require('jquery');
const downloads = $('#downloads').data('downloads');

// Find link based on the detected OS
const dynamicDownload = _.find(downloads, (d) => {
  new RegExp(d.OS).test(platform.os.family);
});

if (dynamicDownload) {
  $('#dynamicDownload').attr('href', dynamicDownload.Release);
}

$('.downloads-table a').click((e) => {
  if (new RegExp('linux').test($(e.target).text())) {
    $('#instructions-linux').removeClass('hidden-xs-up');
  }
});
