
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
var DynamicInput, Promise, _, chalk, os, ipmodule;

_ = require('lodash');

chalk = require('chalk');

Promise = require('bluebird');

DynamicInput = require('./../../input.js');

os = require('os');

ipmodule = require('ip');

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

exports.getGateway = function()
{
    var interfaces = os.networkInterfaces();
    var addresses = [];
    var netmasks = [];
    for (var k in interfaces)
    {
        for (var k2 in interfaces[k])
        {
            var address = interfaces[k][k2];
            if (address.family === 'IPv4' && !address.internal)
            {
                addresses.push(address.address);
                netmasks.push(address.netmask);
            }
        }
    }

    var gateway = '';
    if(addresses.length > 0 && netmasks.length > 0)
    {
        var netmask = ipmodule.subnet(addresses[0], netmasks[0]);
        gateway = netmask.firstAddress;
    }

    return gateway;
}

exports.ask = function(message)
{
    if(message == null)
    {
        message = 'Specify an ip';
    }

    var gateway = exports.getGateway();

    input = new DynamicInput({
            message: message,
            emptyMessage: (chalk.red('x')) + " No gateway was specified!",
            default: gateway
    });

    return input.run()
    .catch(function (err) {
        // Crawling failed... 
        console.log(err);
    });
};