
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
    
    return _.uniq(networks, function(network)
    {
        return network.ssid;
    });
}

exports.ask = function(message)
{
    if(message == null)
    {
        message = 'Select a wifi connection';
    }

    var spinner = new visuals.Spinner("searching..");
    spinner.start();
        
    WiFiControl.init();

    //  Try scanning for access points:
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
            spinner.stop();
            resolve(connections);
        });
        });
    })
    .then(function(connections) 
    {
        var list;

        list = new DynamicList({
            message: message,
            emptyMessage: (chalk.red('x')) + " No connections were found!",
            choices: _.map(connections, connectionToChoice)
        });

        return list.run();
    })
    .catch(function (err) {
        // Crawling failed... 
        console.log(err);
    });
};
