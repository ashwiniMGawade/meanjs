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
        SharesService.query({'page':vm.currentPage, 'perPage': vm.itemsPerPage} ,function (data) {
          vm.shares = data;
          vm.buildPager();
        });
      }

      vm.getClass = function(status) {
        switch(status) {
          case 'Contact Support': return 'danger'; break;
          case 'Completed': return 'success'; break;
          case 'Pending Approval': return 'warning'; break;
          case 'Processing': return 'blue'; break;
          case 'Approved': return 'success'; break;
          case 'Rejected': return 'danger'; break;
          default: return 'primary';
        }
      }


      getShares();

      var refreshData = $interval(function() { 
        reloadCnt++;
        getShares();
      }, 130000);

      $scope.$on('$destroy', function(){
        $interval.cancel(refreshData);
      });     
  
      function buildPager() {
        vm.pagedItems = [];
        vm.itemsPerPage = 10;
        vm.currentPage = vm.currentPage || 1;
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
  