
/*
Copyright 2016 Resin.io

Licensed under the Apache License, Version 2.0 (the "License");
you may not use this file except in compliance with the License.
You may obtain a copy of the License at

   http://www.apache.org/licenses/LICENSE-2.0

Unless required by applicable law or agreed to in writing, software
distributed under the License is distributed on an "AS IS" BASIS,
WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
See the License for the specific language governing permissions and
limitations under the License.
 */
var DriveScanner, DynamicList, Promise, _, chalk, rp, driveToChoice, drivelist, getDrives;

_ = require('lodash');

chalk = require('chalk');

Promise = require('bluebird');

DynamicList = require('inquirer-dynamic-list');

rp = require('request-promise');

var releases ='http://api.github.com/repos/kerberos-io/kios/releases' + 
              '?client_id=d94be23a92a1947d19f5&client_secret=7bf76002079fbdb07992a9bc5c4f57a8dda0c64a';
 
releaseToChoice = function(release)
{
  return {
    name: release.tag_name,
    value: release.tag_name
  };
};

exports.getVersions = function()
{
    return rp({
        url: releases,
        headers : {'User-Agent':'robot'}
    });
}

/**
 * @summary Prompt the user to select a drive device
 * @name drive
 * @function
 * @public
 * @memberof visuals
 *
 * @description
 * The dropdown detects and autorefreshes itself when the drive list changes.
 *
 * @param {String} [message='Select a drive'] - message
 * @returns {Promise<String>} device path
 *
 * @example
 * visuals.drive('Please select a drive').then (drive) ->
 * 	console.log(drive)
 */

exports.ask = function(message)
{
    if(message == null)
    {
        message = 'Select a release';
    }

    return exports.getVersions().then(function(data) 
    {
        // Process data..
        var releases = JSON.parse(data);

        var list;

        list = new DynamicList({
            message: message,
            emptyMessage: (chalk.red('x')) + " No releases were found!",
            choices: _.map(releases, releaseToChoice)
        });

        return list.run();
    })
    .catch(function (err) {
        // Crawling failed... 
        console.log(err);
    });
};
