/*
 * Copyright 2016 Resin.io
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

'use strict';

const visuals = require('./modules/visuals');
const form = require('./modules/form');
const _ = require('lodash');
const Bluebird = require('bluebird');
const drivelist = Bluebird.promisifyAll(require('drivelist'));
const writer = require('./writer');
const utils = require('./utils');
const options = require('./cli');
const log = require('./log');
const request = require('request');
const progress = require('request-progress');
const EXIT_CODES = require('../src/exit-codes');

const tmp = require('tmp');
const fs = Bluebird.promisifyAll(require('fs'));
const zlib = Bluebird.promisifyAll(require('zlib'));
const imagefs = require('resin-image-fs'); 
const replacestream = require('replacestream')
const ipmodule = require('ip');

var file = tmp.fileSync();

        form.run([
        {
            message: 'Select version of KiOS',
            type: 'kios',
            name: 'kios'
        },
        {
            message: 'Select the board',
            type: 'list',
            name: 'board',
            choices: [{
                name: 'Raspberry Pi A or B', 
                value: 'raspberrypi'
            },
            {
                name: 'Raspberry Pi 2',
                value: 'raspberrypi2'
            },
            {
                name: 'Raspberry Pi 3',
                value: 'raspberrypi3'
            }]
        },
        {
            message: 'Select a network',
            type: 'list',
            name: 'network',
            choices: [{
                name: 'Ethernet', 
                value: 'eth'
            },
            {
                name: 'WiFi',
                value: 'wifi'
            }]
        },
        {
            message: 'Select a WiFi connection',
            type: 'wifi',
            name: 'wifi',
            when: {network: 'wifi'}
        },
        {
            message: 'Define the name of the connection yourself',
            type: 'input',
            name: 'wifi',
            when: {wifi: 'other'}
        },
        {
            message: 'What\'s the password for the connection?',
            type: 'password',
            name: 'password',
            when: {network: 'wifi'}
        },
        {
            message: 'Select the network configuration',
            type: 'list',
            name: 'routing',
            choices: [{
              name: 'dynamic', 
              value: 'dynamic'
            },
            {
              name: 'static',
              value: 'static'
            }]
        },
        {
            message: 'Specify the ip address you like to use',
            type: 'ip',
            name: 'ip',
            when: {routing: 'static'},
        },
        {
            message: 'Specify the netmask',
            type: 'netmask',
            name: 'netmask',
            when: {routing: 'static'},
        },
        {
            message: 'Specify the gateway',
            type: 'gateway',
            name: 'gateway',
            when: {routing: 'static'},
        },
        {
            message: 'Specify the DNS address',
            type: 'input',
            name: 'dns',
            default: '8.8.8.8',
            when: {routing: 'static'},
        },
        {
            message: 'Select drive',
            type: 'drive',
            name: 'drive'
        },
        {
            message: 'This will erase the selected drive. Are you sure?',
            type: 'confirm',
            name: 'yes',
            default: false
        }],
        {
            override:
            {
                kios: options.kios,

                board: options.board,

                network: options.network,

                wifi: options.wifi,

                password: options.password,

                routing: options.routing,

                ip: options.ip,

                netmask: options.netmask,

                gateway: options.gateway,

                dns: options.dns,

                drive: options.drive,

                // If `options.yes` is `false`, pass `undefined`,
                // otherwise the question will not be asked because
                // `false` is a defined value.
                yes: options.robot || options.yes || undefined

            }
        })
        .then((answers) => {

            if (!answers.yes)
            {
                throw new Error('Aborted');
            }

            const progressBars = {
                downloading: new visuals.Progress('Downloading'),
                write: new visuals.Progress('Flashing'),
                check: new visuals.Progress('Validating')
            };

            return drivelist.listAsync().then((drives) => {
                
                const selectedDrive = _.find(drives, {
                    device: answers.drive
                });

                if (!selectedDrive)
                {
                    throw new Error(`Drive not found: ${answers.drive}`);
                }

            // Get correct image for the selected pi.

            return visuals.kios.getVersions().then((releases) => {

                return new Bluebird((resolve, reject) => {

                    releases = JSON.parse(releases);
                    var release = _.find(releases, {'tag_name': answers.kios});

                    var assets = release.assets;
                    var image = _.find(assets, function(asset)
                    {
                        return asset.name.indexOf(answers.board) > -1;
                    });

                    if(image)
                    {
                        resolve(image.browser_download_url);
                    }
                    else
                    {
                        throw new Error('Image could not be found for release ' + answers.kios);
                    }
                });

            })
            .then((url) => {

                return new Bluebird((resolve, reject) => {
                    var totalSize = 0;
                    var currentSize = 0;
                  
                    var body = "";
                    progress(request({
                        url: url,
                        headers : {'User-Agent':'robot'},
                        method: 'GET',
                        encoding: null
                    },
                    function(err, response, body)
                    {
                        zlib.gunzip(body, function(err, dezipped)
                        {
                            resolve(dezipped);
                        });
                    }))
                    .on('progress', function(state)
                    {
                        if (options.robot)
                        {
                            if(state.time.remaining)
                            {
                                log.toStdout(JSON.stringify({
                                    command: 'progress',
                                    data: {
                                        type: 'downloading',
                                        percentage: parseInt(state.percentage*100),
                                        eta: parseInt(state.time.remaining),
                                        speed: parseInt(state.speed)
                                    }
                                }));
                            }
                        }
                        else 
                        {
                            progressBars['downloading'].update({
                                percentage: parseInt(state.percentage*100),
                                eta: parseInt(state.time.remaining),
                                speed: parseInt(state.speed)
                            });
                        }
                    })
                });
            })
            .then((data) => {

                if (options.robot)
                {
                    /*log.toStdout(JSON.stringify(
                    {
                        command: 'done',
                        data:{}
                    }));*/
                }
                else
                {
                    console.log('Image downloaded succesfully!');
                }

                return fs.appendFile(file.name, data);
            })
            .then((stream) => {
          
                // Write configuration files
                return imagefs.read(
                {
                    image: file.name,
                    partition:
                    {
                        primary: 4,
                        logical: 1
                    },
                    path: 'wireless.conf'
                }
            )
            .then((stream) => {

                if(answers.network == 'wifi')
                {
                    return imagefs.write(
                    {
                        image: file.name,
                        partition:
                        {
                            primary: 4,
                            logical: 1
                        },
                        path: 'wireless.conf'
                    },
                    stream
                    .pipe(replacestream("ssid=\"\"", "ssid=\"" + answers.wifi + "\""))
                    .pipe(replacestream("psk=\"\"", "psk=\"" + answers.password + "\""))
                    )
                }
                else
                {
                    return stream;
                }
            })
            .then((stream) => {

                return imagefs.read(
                {
                    image: file.name,
                    partition:
                    {
                        primary: 4,
                        logical: 1
                    },
                    path: 'static_ip.conf'
                },
                stream
                )
            })
            .then((stream) => {

                if(answers.routing == 'static')
                {
                    return imagefs.write(
                    {
                        image: file.name,
                        partition:
                        {
                            primary: 4,
                            logical: 1
                        },
                        path: 'static_ip.conf'
                    },
                    stream
                    .pipe(replacestream("static_ip=\"\"", "static_ip=\"" + answers.ip + '/' + ipmodule.subnet(answers.ip, answers.netmask).subnetMaskLength + "\""))
                    .pipe(replacestream("static_gw=\"\"", "static_gw=\"" + answers.gateway + "\""))
                    .pipe(replacestream("static_dns=\"\"", "static_dns=\"" + answers.dns + "\""))
                    )
                }
                else
                {
                    return stream;
                }
            })
            .then((stream) => {
          
                return writer.writeImage(file.name, selectedDrive,
                {
                    unmountOnSuccess: options.unmount,
                    validateWriteOnSuccess: options.check
                },
                (state) => {

                    if (options.robot)
                    {
                        log.toStdout(JSON.stringify({
                            command: 'progress',
                            data: {
                                type: state.type,
                                percentage: Math.floor(state.percentage),
                                eta: state.eta,
                                speed: Math.floor(state.speed)
                            }
                        }));
                    }
                    else 
                    {
                        progressBars[state.type].update(state);
                    }
                })
            }) 
          
            .then((results) => {

                if (options.robot)
                {
                    log.toStdout(JSON.stringify(
                    {
                        command: 'done',
                        data:
                        {
                            passedValidation: results.passedValidation,
                            sourceChecksum: results.sourceChecksum
                        }
                    }));
                }
                else
                {
                    if (results.passedValidation)
                    {
                        console.log('Your flash is complete!');
                        console.log(`Checksum: ${results.sourceChecksum}`);
                    }
                    else
                    {
                        console.error('Validation failed!');
                    }
                }

                if (results.passedValidation)
                {
                    process.exit(EXIT_CODES.SUCCESS);
                }
                else
                {
                    process.exit(EXIT_CODES.VALIDATION_ERROR);
                }  

            })
        })
        })

        .catch((error) => {

            if (options.robot)
            {
                log.toStderr(JSON.stringify(
                {
                    command: 'error',
                    data:
                    {
                        message: error.message
                
                    }
                }));
            }
            else
            {
                utils.printError(error);
            }

            process.exit(EXIT_CODES.GENERAL_ERROR);

        })
        .finally(log.close);

        });
