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

'use strict';

const inquirer = require('inquirer');
const Choices = require('inquirer/lib/objects/choices');

/**
 * Update an [DynamicList]{@link DynamicLink}'s choices
 *
 * @param {DynamicList} list - The instance to update choices for
 * @param {Object[]} choices - The new choices
 */
const updateChoices = function(list, choices) {
  if (list.opt.mapFn) {
    choices = choices.map(list.opt.mapFn);
  }
  if (list.opt.sort) {
    choices.sort(list.opt.compareFn);
  }
  list.opt.choices = new Choices(choices);
  list.render();
};

/**
 * @summary Prompt for `inquirer` that adds dynamic update functionality to the `list` prompt.
 *
 * @description
 * This class shouldn't be instantiated by the user, just registered as an `inquirer` prompt.
 *
 * @public
 * @extends inquirer.prompt.prompts.list
 * @example
 * inquirer.registerPrompt('dynamicList', DynamicList);
 *
 * inquirer.prompt([{
 *   message: 'What size do you need?',
 *   type: 'dynamicList',
 *   choices: [ 'Jumbo', 'Large', 'Standard', 'Medium', 'Small', 'Micro' ],
 *   emitter: emitter,  // Event emitter with event `change` and methods `start` and `stop`
 *   name: 'size',
 *
 *   // optional, used to transform one element from the emitter into a `list` choice
 *   mapFn: _.identity,
 *   sort: true, // optional
 *
 *   //  optional, used to compare two `list` choices when `sort === true`
 *   compareFn: (a, b) => {
 *     return a.value - b.value
 *   }
 * });
 */
class DynamicList extends inquirer.prompt.prompts.list {

  /** @inheritdoc */
  constructor(...args) {
    super(...args);

    this.opt.emitter.on('change', (choices) => {
      updateChoices(this, choices);
    });
    this.opt.emitter.start();
  }

  /** @inheritdoc */
  onSubmit(...args) {
    // We should stop the emitter when done
    this.opt.emitter.stop();
    return super.onSubmit(...args);
  }
}

module.exports = DynamicList;
