(function () {
    'use strict';
  
    angular
      .module('settings.routes')
      .config(routeConfig);
  
    routeConfig.$inject = ['$stateProvider'];
  
    function routeConfig($stateProvider) {
      $stateProvider
        .state('settings', {
          abstract: true,
          url: '/settings',
          template: '<ui-view/>'         
        })
        .state('settings.list', {
          url: '',
          templateUrl: 'modules/settings/client/views/settings.client.view.html',
          controller: 'SettingsListController',
          controllerAs: 'vm',
          data: {
            roles: ['admin']
          }
        })
  
    }
  }());
  