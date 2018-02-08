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

const _ = require('lodash')

module.exports = {

  subjectParser: 'angular',

  getGitReferenceFromVersion: 'v-prefix',

  editChangelog: true,

  editVersion: false,

  addEntryToChangelog: {
    preset: 'prepend',
    fromLine: 5
  },

  includeCommitWhen: (commit) => {
    return commit.footer['Changelog-Entry']
  },

  getIncrementLevelFromCommit: (commit) => {
    if (/none/i.test(commit.footer['Change-Type'])) {
      return null
    }
    return commit.footer['Change-Type'] &&
      _.toLower(commit.footer['Change-Type'])
  },

  transformTemplateData: (data) => {
    data.features = _.filter(data.commits, {
      subject: {
        type: 'feat'
      }
    })

    data.fixes = _.filter(data.commits, {
      subject: {
        type: 'fix'
      }
    })

    data.misc = _.filter(data.commits, (commit) => {
      return !_.includes([ 'fix', 'feat' ], commit.subject.type)
    })

    return data
  },

  template: [
    '## v{{version}} - {{moment date "Y-MM-DD"}}',
    '{{#if features.length}}',
    '',
    '### Features',
    '',
    '{{#each features}}',
    '{{#with footer}}',
    '- {{capitalize Changelog-Entry}}',
    '{{/with}}',
    '{{/each}}',
    '{{/if}}',
    '{{#if fixes.length}}',
    '',
    '### Fixes',
    '',
    '{{#each fixes}}',
    '{{#with footer}}',
    '- {{capitalize Changelog-Entry}}',
    '{{/with}}',
    '{{/each}}',
    '{{/if}}',
    '{{#if misc.length}}',
    '',
    '### Misc',
    '',
    '{{#each misc}}',
    '{{#with footer}}',
    '- {{capitalize Changelog-Entry}}',
    '{{/with}}',
    '{{/each}}',
    '{{/if}}'
  ].join('\n')

}
