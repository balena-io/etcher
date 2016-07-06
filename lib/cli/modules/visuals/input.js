
/*
The MIT License
Copyright (c) 2015 Michalis Korakakis, Inc. https://github.com/mkorakakis.
Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:
The above copyright notice and this permission notice shall be included in
all copies or substantial portions of the Software.
THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
THE SOFTWARE.
 */

/**
 * @module DynamicInput
 */
var DynamicInput, InquirerList, Promise, UI, _,
  __hasProp = {}.hasOwnProperty,
  __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; };

_ = require('lodash');

Promise = require('bluebird');

InquirerInput = require('inquirer/lib/prompts/input');

UI = require('inquirer/lib/ui/baseUI');

module.exports = DynamicInput = (function(_super)
{
  __extends(DynamicInput, _super);


  /**
  	 * @summary Dynamic list widget
  	 * @name DynamicInput
  	 * @class
  	 * @public
  	 *
  	 * @param {Object} [options] - options
  	 * @param {Object[]} options.choices - initial choices
  	 * @param {String} options.message - widget message
  	 * @param {String} [options.emptyMessage='No options'] - message for when no choices
  	 *
  	 * @example
  	 * list = new DynamicInput
  	 * 	message: 'Foo'
  	 * 	emptyMessage: 'Nothing to show'
  	 * 	choices: [
  	 * 		name: 'Foo'
  	 * 		value: 'foo'
  	 * 	]
  	 *
  	 * # Run the list widget
  	 * list.run().then (answer) ->
  	 * 	console.log(answer)
  	 *
  	 * # You can add new choices on the fly
  	 * list.addChoice
  	 * 	name: 'Bar'
  	 * 	value: 'bar'
  	 *
  	 * # We re-render to be able to see the new options
  	 * list.render()
   */

  function DynamicInput(options) {
    var _base, _base1;
    this.options = options;
    if ((_base = this.options).name == null) {
      _base.name = 'dynamic-input';
    }
    if ((_base1 = this.options).emptyMessage == null) {
      _base1.emptyMessage = 'No value';
    }
    this.ui = new UI({
      input: process.stdin,
      output: process.stdout
    });
    DynamicInput.__super__.constructor.call(this, this.options, this.ui.rl);
  }

  /**
  	 * @summary Event listener for when a choice is selected
  	 * @method
  	 * @private
   */

  DynamicInput.prototype.onSubmit = function() {
    if (this.isEmpty()) {
      return;
    }
    return DynamicInput.__super__.onSubmit.apply(this, arguments);
  };


  /**
  	 * @summary Render the list
  	 * @method
  	 * @public
  	 *
  	 * @example
  	 * list = new DynamicInput
  	 * 	message: 'Foo'
  	 * 	emptyMessage: 'Nothing to show'
  	 * 	choices: [
  	 * 		name: 'Foo'
  	 * 		value: 'foo'
  	 * 	]
  	 *
  	 * list.render()
   */

  DynamicInput.prototype.render = function() {
    return DynamicInput.__super__.render.apply(this, arguments);
  };


  /**
  	 * @summary Run the widget
  	 * @method
  	 * @public
  	 *
  	 * @fulfil {String} answer
  	 * @returns {Promise}
  	 *
  	 * @example
  	 * list = new DynamicInput
  	 * 	message: 'Foo'
  	 * 	emptyMessage: 'Nothing to show'
  	 * 	choices: [
  	 * 		name: 'Foo'
  	 * 		value: 'foo'
  	 * 	]
  	 *
  	 * list.run().then (answer) ->
  	 * 	console.log(answer)
   */

  DynamicInput.prototype.run = function() {
    return Promise.fromNode((function(_this) {
      return function(callback) {
        return DynamicInput.__super__.run.call(_this, function(answers) {
          _this.ui.close();
          return callback(null, answers);
        });
      };
    })(this));
  };

  return DynamicInput;

})(InquirerInput);