(function () {
  'use strict';

  angular
    .module('settings.services')
    .factory('SettingsService', SettingsService);

    SettingsService.$inject = ['$resource', '$log'];

  function SettingsService($resource, $log) {
    var Setting = $resource('/storage/api/settings/:settingId', {
      settingId: '@_id'
    },
    {
      query: {
      method: 'GET',
      isArray: false,
    },    
    updateRequest: {
      method: 'PUT',
      params: {
        settingId:'@settingId'
      },
      url: '/storage/api/settings/:settingId'
    }
    });

    angular.extend(Setting.prototype, {
      createOrUpdate: function () {
        var setting = this;
        console.log(setting)
        return createOrUpdate(setting);
      }
    });

    return Setting;

    function createOrUpdate(setting) {
      if (setting._id) {
        return share.$update(onSuccess, onError);
      } else {
        return share.$save(onSuccess, onError);
      }

      // Handle successful response
      function onSuccess(setting) {
        // Any required internal processing from inside the service, goes here.
      }

      // Handle error response
      function onError(errorResponse) {
        var error = errorResponse.data;
        // Handle error internally
        handleError(error);
      }
    }

    function handleError(error) {
      // Log error
      $log.error(error);
    }
  }
}());
