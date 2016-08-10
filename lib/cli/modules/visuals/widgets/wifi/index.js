
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
var DriveScanner, DynamicList, Promise, _, chalk, rp, async, connectionToChoice, checkForGoodConnections, WiFiControl;

_ = require('lodash');

chalk = require('chalk');

Promise = require('bluebird');

DynamicList = require('inquirer-dynamic-list');

rp = require('request-promise');

async = require('async');

WiFiControl = Promise.promisifyAll(require('wifi-control'));

visuals = require('resin-cli-visuals');

connectionToChoice = function(connection)
{
  return {
    name: connection.ssid,// + ' signal( ' + connection.signal_level + ' )',
    value: connection.ssid
  };
};

checkForGoodConnections = function(connections)
{
    var networks = [];

    if(connections)
    for(var i = 0; i < connections.length; i++)
    {
        if(connections[i].ssid != '' && connections[i].ssid != 'SSID' && connections[i].mac != '')
        {
            networks.push(connections[i]);
        }
    }
    
    return _.uniqBy(networks, 'ssid');
}

exports.getConnections = function()
{
    WiFiControl.init();

    return WiFiControl.scanForWiFiAsync()
    .then((response) => {

        return new Promise((resolve, reject) => {

        var connections = checkForGoodConnections(response.networks);

        async.whilst(function()
        {
            return !connections || connections.length == 0;
        },
        function(next)
        {
            WiFiControl.scanForWiFiAsync()
            .then((response) => {
                connections = checkForGoodConnections(response.networks);
                setTimeout(next, 500);
            });
        },
        function(next)
        {
            resolve(connections);
        });
        });
    })
}

exports.ask = function(message)
{
    if(message == null)
    {
        message = 'Select a wifi connection';
    }

    var spinner = new visuals.Spinner("searching..");
    spinner.start();

    //  Try scanning for access points:
    return exports.getConnections()
    .then(function(connections) 
    {
        spinner.stop();

        var list;

        connections = _.map(connections, connectionToChoice);
        connections.push({name: 'Not in this list', value: 'other'});

        list = new DynamicList({
            message: message,
            emptyMessage: (chalk.red('x')) + " No connections were found!",
            choices: connections
        });

        return list.run();
    })
    .catch(function (err) {
        // Crawling failed... 
        console.log(err);
    });
};
