(function () {
    'use strict';
  
    angular
      .module('shares')
      .controller('SharesListController', SharesListController);
  
    SharesListController.$inject = ['$scope', '$filter', 'SharesService', 'Authentication', '$interval'];
  
    function SharesListController($scope, $filter, SharesService, Authentication, $interval) {
      var vm = this;
      vm.buildPager = buildPager;
      vm.figureOutItemsToDisplay = figureOutItemsToDisplay;
      vm.pageChanged = pageChanged;
      vm.isAdmin = Authentication.user.roles.indexOf('admin') != -1;
      var reloadCnt = 0;

      vm.categories = sharedConfig.share.categories;

      var getShares = function() {
        SharesService.query(function (data) {
          vm.shares = data;
          vm.buildPager();
        });
      }


      getShares();

      var refreshData = $interval(function() { 
        reloadCnt++;
        getShares();
      }, 30000);

      
  
     
  
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
  