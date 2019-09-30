(function () {
    'use strict';
  
    angular
      .module('shares')
      .controller('SharesListController', SharesListController);
  
    SharesListController.$inject = ['$scope', '$filter', 'SharesService', 'Authentication', '$interval'];
  
    function SharesListController($scope, $filter, SharesService, Authentication, $interval) {
      var vm = this;
      vm.buildPager = buildPager;
      vm.currentPage = 1;
      vm.itemsPerPage = 15;
      vm.figureOutItemsToDisplay = figureOutItemsToDisplay;
      vm.pageChanged = pageChanged;
      vm.loadMore = loadMore;
      vm.searchRecords = searchRecords;
      vm.isAdmin = Authentication.user.roles.indexOf('admin') != -1;
      var reloadCnt = 0;
      vm.loading = false;

      vm.categories = sharedConfig.share.categories;
      vm.totalRecords  = 0;

      vm.getShares = function(loadMore) {
        loadMore  = loadMore | false;
        vm.loading = true;
        SharesService.query({
          'page': loadMore ? vm.currentPage - 1 : 0, 
          'perPage': loadMore ? vm.itemsPerPage : vm.itemsPerPage+(vm.currentPage - 1)*(vm.itemsPerPage),
          's': vm.search
        } ,function (data) {
          vm.shares = ( loadMore ?   vm.shares.concat(data.shares) : data.shares);
          vm.totalRecords = data.total;
          //vm.buildPager();
          //removed pagination and added loader
          vm.pagedItems = vm.shares;
          vm.loading = false;
        });
      }

      vm.getClass = function(status) {
        switch(status) {
          case 'Contact Support': return 'text-danger'; break;
          case 'Completed': return 'text-success'; break;
          case 'Pending Approval': return 'text-warning'; break;
          case 'Processing': return 'text-blue'; break;
          case 'Approved': return 'text-success'; break;
          case 'Rejected': return 'text-danger'; break;
          default: return 'primary';
        }
      }


      vm.getShares();

      var refreshData = $interval(function() { 
        reloadCnt++;
        vm.getShares();
      }, 130000);

      $scope.$on('$destroy', function(){
        $interval.cancel(refreshData);
      });     
  
      function buildPager() {
        vm.pagedItems = [];
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

      function loadMore() {
        if((vm.totalRecords - vm.currentPage * vm.itemsPerPage) > 0) {
          vm.currentPage = vm.currentPage || 1;
          vm.currentPage += 1;
          vm.getShares(true);
        }       
      }

      function searchRecords() {
        vm.shares = [];
        vm.currentPage = 1;
        vm.pagedItems = [];   
        vm.getShares();     
      }
    }
  }());
  