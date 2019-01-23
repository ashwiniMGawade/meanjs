(function () {
    'use strict';
  
    angular
      .module('shares')
      .run(menuConfig);
  
    menuConfig.$inject = ['menuService'];
  
    function menuConfig(menuService) {
      menuService.addMenuItem('topbar', {
        title: 'Shares',
        state: 'shares',
        type: 'dropdown',
        roles: ['user', 'admin']
      });
  
      // Add the dropdown list item
      menuService.addSubMenuItem('topbar', 'shares', {
        title: 'List Shares',
        state: 'shares.list',
        roles: ['user', 'admin']
      });
    }
  }());
  