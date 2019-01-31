(function () {
    'use strict';
  
    angular
      .module('shares')
      .controller('SharesListController', SharesListController);
  
    SharesListController.$inject = ['$scope', '$filter', 'SharesService'];
  
    function SharesListController($scope, $filter, SharesService) {
      var vm = this;
      vm.buildPager = buildPager;
      vm.figureOutItemsToDisplay = figureOutItemsToDisplay;
      vm.pageChanged = pageChanged;

      vm.fileSizeTypes = {
        "officeFile":"Office File",
        "compressedFile": "Compressed File",
        "dataAndDBFile": "Data And Database File",
        "executableFile": "Executable File",
        "imageFile": "Image File",
        "programmingFile":"Programming File",
        "videoFile": "Video File",
        "audioFile":"Audio File",
        "backupFile":"Backup File"
      }
  
      SharesService.query(function (data) {
        vm.shares = data;
        vm.buildPager();
      });
  
      function buildPager() {
        vm.pagedItems = [];
        vm.itemsPerPage = 2;
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
  