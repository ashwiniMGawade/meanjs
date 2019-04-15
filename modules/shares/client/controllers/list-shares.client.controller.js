(function () {
    'use strict';
  
    angular
      .module('shares')
      .controller('SharesListController', SharesListController);
  
    SharesListController.$inject = ['$scope', '$filter', 'SharesService', 'Authentication'];
  
    function SharesListController($scope, $filter, SharesService, Authentication) {
      var vm = this;
      vm.buildPager = buildPager;
      vm.figureOutItemsToDisplay = figureOutItemsToDisplay;
      vm.pageChanged = pageChanged;
      vm.isAdmin = Authentication.user.roles.indexOf('admin') != -1;

      vm.categories = sharedConfig.share.categories;
  
      SharesService.query(function (data) {
        vm.shares = data;
        vm.buildPager();
      });
  
      function buildPager() {
        vm.pagedItems = [];
        vm.itemsPerPage = 10;
        vm.currentPage = 1;
        vm.figureOutItemsToDisplay();
      }
  
      function figureOutItemsToDisplay() {
        vm.filteredItems = $filter('filter')(vm.shares, {
          $: vm.search
        });
        vm.filterLength = vm.filteredItems.length;
        var begin = ((vm.currentPage - 1) * vm.itemsPerPage);
        var end = begin + vm.itemsPerPage;
        vm.pagedItems = vm.filteredItems.slice(begin, end);
      }
  
      function pageChanged() {
        vm.figureOutItemsToDisplay();
      }
    }
  }());
  