/*
 * Copyright 2016 resin.io
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

'use strict'

// This script generates Dockerfiles based on a template containing all
// the necessary dependencies/ to run and build Etcher in multiple platforms.

const _ = require('lodash')
const fs = require('fs')
const path = require('path')
const currentDirectory = __dirname

const template = fs.readFileSync(path.join(currentDirectory, 'Dockerfile.template'), {
  encoding: 'utf8'
})

_.each([
  {
    architecture: 'i686',
    image: 'erwinchang/ubuntu-12.04-32bit-build'
  },
  {
    architecture: 'x86_64',
    image: 'ubuntu:12.04'
  },
  {
    architecture: 'armv7hf',
    image: 'resin/armv7hf-debian:jessie'
  }
], (options) => {
  const result = _.template(template)(options)
  const filename = path.join(currentDirectory, `Dockerfile-${options.architecture}`)
  fs.writeFileSync(filename, result)
})
