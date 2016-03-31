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

/**
 * @module Etcher.Components.DriveSelector
 */

const _ = require('lodash');
const angular = require('angular');
require('angular-ui-bootstrap');
require('../../browser/modules/drive-scanner');
const DriveSelector = angular.module('Etcher.Components.DriveSelector', [
  'ui.bootstrap',
  'Etcher.drive-scanner'
]);

DriveSelector.service('DriveSelectorStateService', function() {

  /**
   * @summary Toggle select drive
   * @function
   * @public
   *
   * @param {Object} drive - drive
   *
   * @example
   * DriveSelectorController.toggleSelectDrive({ drive });
   */
  this.toggleSelectDrive = function(drive) {
    if (this.isSelectedDrive(drive)) {
      this.selectedDrive = null;
    } else {
      this.selectedDrive = drive;
    }
  };

  /**
   * @summary Check if a drive is the selected one
   * @function
   * @public
   *
   * @param {Object} drive - drive
   * @returns {Boolean} whether the drive is selected
   *
   * @example
   * if (DriveSelectorController.isSelectedDrive({ drive })) {
   *   console.log('The drive is selected!');
   * }
   */
  this.isSelectedDrive = function(drive) {
    if (!_.has(drive, 'device')) {
      return false;
    }

    return drive.device === _.get(this.selectedDrive, 'device');
  };

  /**
   * @summary Get selected drive
   * @function
   * @public
   *
   * @returns {Object} selected drive
   *
   * @example
   * const drive = DriveSelectorStateService.getSelectedDrive();
   */
  this.getSelectedDrive = function() {
    if (_.isEmpty(this.selectedDrive)) {
      return;
    }

    return this.selectedDrive;
  };

});

DriveSelector.controller('DriveSelectorController', function($uibModalInstance, DriveSelectorStateService, DriveScannerService) {

  /**
   * @summary The drive selector state
   * @property
   * @type Object
   *
   * @description
   * The state has been splitted from the controller for
   * testability purposes.
   */
  this.state = DriveSelectorStateService;

  /**
   * @summary The drive scanner service
   * @property
   * @type Object
   *
   * @description
   * We expose the whole service instead of the `.drives`
   * property, which is the one we're interested in since
   * this allows the property to be automatically updated
   * when `DriveScannerService` detects a change in the drives.
   */
  this.scanner = DriveScannerService;

  /**
   * @summary Close the modal and resolve the selected drive
   * @function
   * @public
   *
   * @example
   * DriveSelectorController.closeModal();
   */
  this.closeModal = function() {
    const selectedDrive = DriveSelectorStateService.getSelectedDrive();

    // Sanity check to cover the case where a drive is selected,
    // the drive is then unplugged from the computer and the modal
    // is resolved with a non-existent drive.
    if (!selectedDrive || !_.includes(this.scanner.drives, selectedDrive)) {
      return $uibModalInstance.dismiss();
    }

    return $uibModalInstance.close(selectedDrive);
  };

});

DriveSelector.service('DriveSelectorService', function($uibModal) {

  /**
   * @summary Open the drive selector widget
   * @function
   * @public
   *
   * @fulfil {(Object|Undefined)} - selected drive
   * @returns {Promise}
   *
   * @example
   * DriveSelectorService.open().then(function(drive) {
   *   console.log(drive);
   * });
   */
  this.open = function() {
    return $uibModal.open({
      animation: true,
      template: [
        '<div class="modal-header">',
          '<h4 class="modal-title">SELECT A DRIVE</h4>',
          '<button class="btn btn-default btn-sm" ng-click="modal.closeModal()">CLOSE</button>',
        '</div>',

        '<div class="modal-body">',
          '<ul class="list-group">',
            '<li class="list-group-item" ng-repeat="drive in modal.scanner.drives"',
              'ng-click="modal.state.toggleSelectDrive(drive)">',
                '<div>',
                  '<h4 class="list-group-item-heading">{{ drive.description }} - {{ drive.size }}</h4>',
                  '<p class="list-group-item-text">{{ drive.device }}</p>',
                '</div>',
                '<span class="tick tick--success" ng-disabled="!modal.state.isSelectedDrive(drive)"></span>',
            '</li>',
          '</ul>',
        '</div>'
      ].join('\n'),
      controller: 'DriveSelectorController as modal',
      size: 'sm'
    }).result;
  };

});
