(function () {
    'use strict';
  
    angular
      .module('shares')
      .run(menuConfig);
  
    menuConfig.$inject = ['menuService'];
  
    function menuConfig(menuService) {
      menuService.addMenuItem('topbar', {
        title: 'Requests',
        state: 'shares',
        type: 'dropdown',
        roles: ['user', 'admin']
      });
  
      // Add the dropdown list item
      menuService.addSubMenuItem('topbar', 'shares', {
        title: 'List Requests',
        state: 'shares.list',
        roles: ['user', 'admin']
      });
    }
  }());
  