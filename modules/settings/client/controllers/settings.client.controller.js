(function ()  {
    'use strict';
  
    angular
      .module('settings')
      .controller('SettingsListController', SettingsListController);
  
      SettingsListController.$inject = ['$scope', 'Authentication', '$sanitize','SettingsService', 'Notification', '$state', 'modalService'];
  
    function SettingsListController($scope, Authentication, $sanitize, SettingsService, Notification, $state, modalService) {
      
      var vm = this;
      vm.authentication = Authentication;
      vm.isAdmin = Authentication.user.roles.indexOf('admin') != -1;
      vm.isLoading = false;
      

      vm.getSettings = function() {
        vm.loading = true;
        SettingsService.query({          
        } ,function (data) {
          vm.settings = data.settings;
          vm.loading = false;
        });
      }
      vm.getSettings();
      vm.editSettings = {};

      vm.edit  = function(settingId) {
        vm.editSettings[settingId] = true;
      }
      vm.showError = function(err) {      
        var modalOptions = {
          closeButtonText: 'Cancel',
          actionButtonText: 'Ok',
          headerText: '<span class="text-danger"><span class="glyphicon glyphicon-alert" aria-hidden="true"></span>&nbsp;&nbsp;Error!</span>',
          bodyText: ['<div class="alert alert-danger">'+err+'</div>'],
          showCancel:false
        };
        modalService.showModal({}, modalOptions).then(function (result) {         
        });
      }

      vm.save  = function(setting, value) {
        var settingObject = setting;
        SettingsService.updateRequest({settingId: settingObject._id}, {"cost": $sanitize(value)})
        .$promise.then(function (response) {
          vm.editSettings[settingObject._id] = false;
          Notification.success({
            message: '<i class="glyphicon glyphicon-ok"></i>Record is successfully updated!',
            positionX: 'center',
            positionY: 'top'
          });
          vm.getSettings();
        }, function(res) {
          Notification.error({ message: response.data.message, title: '<i class="glyphicon glyphicon-remove"></i>' });
        })      
      }
  
    }
  
  }());
  
  
  
  