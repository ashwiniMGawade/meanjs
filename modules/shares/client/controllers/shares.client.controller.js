(function () {
    'use strict';
  
    angular
      .module('shares')
      .controller('SharesController', SharesController);
      
  
    SharesController.$inject = ['$scope', '$state', '$window', 'shareResolve', 'Authentication', 'Notification', 'projectResolve',  'SharesService',  'UsersService', 'modalService', '$sanitize', '$filter'];
  
    function SharesController($scope, $state, $window, share, Authentication, Notification, projectInfo,  SharesService, UsersService,  modalService, $sanitize, $filter) {
      var vm = this;

      vm.selected = undefined;
      vm.ngModelOptionsSelected = function(value) {
        if (arguments.length) {
          _selected = value;
        } else {
          return _selected;
        }
      };
      
      /**reference from http://dotansimha.github.io/angularjs-dropdown-multiselect/docs/#/main */
        vm.readOnlyAndWritesettings = { 
          enableSearch: true, 
          idProp: 'sAMAccountName',
          displayProp: 'displayName',
          searchField: 'sAMAccountName',
          scrollableHeight: '200px',
          scrollable: true,
          smartButtonMaxItems: 4,
          selectedToTop:true,
          smartButtonTextConverter: function(itemText, originalItem) { 
            return itemText;
          }
        };

        vm.readOnly = [];
        vm.readAndWrite = [];
        vm.readWriteAndModify = [];

        vm.readWriteAndModifysettings = { 
          enableSearch: true, 
          idProp: 'sAMAccountName',
          displayProp: 'displayName',
          searchField: 'sAMAccountName',
          scrollableHeight: '200px',
          scrollable: true,
          smartButtonMaxItems: 2,
          selectedToTop:true,
          smartButtonTextConverter: function(itemText, originalItem) { 
            return itemText;
          }
        };
        
      vm.defaultUserSelectionText = {
        buttonDefaultText: 'Select Users From the List'
      };
      
      vm.customFilter = 'a';

      vm.share = share; 
      
      vm.aclGroups = [];  
      vm.share.storage = vm.share.storage || {}
      vm.project = projectInfo;
      vm.cifShareDetails = {};
      
      if ( projectInfo) {
        SharesService.getCifsShareDetails({
          'volname': projectInfo.txtibucode,
          'sharename': projectInfo.projectcode, 
          'location':projectInfo.city
        }).$promise.then(function(res) {
          vm.cifShareDetails = res;
          vm.usedsizegb = vm.cifShareDetails.usedGB || 0;
          vm.allocatedSize = vm.cifShareDetails.sizeGB || 0;
          vm.availableSize = vm.allocatedSize - vm.usedsizegb;
          //get groups for existing cifs share
          if (vm.cifShareDetails.sharename) {
            SharesService.getCifsShareACLGroups({
              'sharename': vm.cifShareDetails.sharename
            }).$promise.then(function(res) {
              vm.aclGroups = res;
            });
          }          
        });

        vm.getACLgroups = function() {
          if (vm.aclGroups.length > 0) {
            if (vm.share.operation == 'removeUserOrGroupFromShare') {
              return vm.aclGroups;
            }
            if (vm.share.operation == 'addUserToADGroup' || vm.share.operation == 'removeUserFromADGroup') {
              var data = $filter('filter')(vm.aclGroups, vm.cifShareDetails.sharename);
              return data;
            }
          }
        }
        
        vm.project.startDate = new Date(projectInfo.startDate)
        vm.project.endDate = new Date(projectInfo.endDate)
        vm.share.city = vm.share.city || projectInfo.city;
        vm.share.bu = vm.share.bu || projectInfo.txtibucode;
        vm.share.projectCode = vm.share.projectCode || projectInfo.projectcode;
        vm.share.approvers = vm.share.approvers || projectInfo.dm + ';'+ projectInfo.pm;

        //get users list

        UsersService.getUsers({
        }).$promise.then(function(res) {
          vm.users = res
        })
      }
      
      vm.authentication = Authentication;
      vm.isAdmin = Authentication.user.roles.indexOf('admin') != -1;
      vm.form = {};
      vm.remove = remove;
      vm.save = save;
      vm.showActions = false;

      vm.categories = sharedConfig.share.categories;
      vm.allowedOperations = sharedConfig.share.allowedChangePermissionOperations;
      vm.allowedPermissions = sharedConfig.share.allowedPermissions;
      vm.fileSizeTypes = sharedConfig.share.fileSizeTypes;

      vm.toggleActions = function() {
        vm.showActions = !vm.showActions;
      }
      
      
      vm.getFilteredCategories = function() {
        var keyNewShareCat = 'newShare';
        var obj = {};
        if (vm.cifShareDetails.sharepath) {
          obj = Object.assign({}, vm.categories);
          delete obj[keyNewShareCat];
          return obj;
         } else {          
          obj[keyNewShareCat] = vm.categories[keyNewShareCat];
          return obj;
        }        
      }

      

     var dateDiffInYears = function (dateold, datenew) {
        var ynew = datenew.getFullYear();
        var mnew = datenew.getMonth();
        var dnew = datenew.getDate();
        var yold = dateold.getFullYear();
        var mold = dateold.getMonth();
        var dold = dateold.getDate();
        var diff = ynew - yold;
        if (mold > mnew) diff--;
        else {
            if (mold == mnew) {
                if (dold > dnew) diff--;
            }
        }
        return diff;
    }

    vm.approve = function() {
      var modalOptions = {
        closeButtonText: 'Cancel',
        actionButtonText: 'Ok',
        headerText: 'Approve request?',
        bodyText: ['Are you sure you want to approve this request?']
      };

      modalService.showModal({}, modalOptions).then(function (result) {
        SharesService.updateRequest({shareId: vm.share._id, action: 'approve'}, {"comment": $sanitize(vm.comment)} ,function () {
          $state.go('shares.list');
          Notification.success({ message: '<i class="glyphicon glyphicon-ok"></i>Request is successfully approved will take some time to process the request!' });
        });
      });
    }

    vm.reject = function() {
      var modalOptions = {
        closeButtonText: 'Cancel',
        actionButtonText: 'Ok',
        headerText: 'Reject request?',
        bodyText: ['Are you sure you want to reject this request?']
      };
      modalService.showModal({}, modalOptions).then(function (result) {
        SharesService.updateRequest({shareId: vm.share._id, action: 'reject'}, function () {
          $state.go('shares.list');
          Notification.success({ message: '<i class="glyphicon glyphicon-ok"></i>Request is  successfully rejected!' });
        });
      });
    }
    
    $scope.calculateCapacity = function() {
        var fileSizeArray = sharedConfig.share.fileSizeArray;
        vm.share.sizegb = 0;

        angular.forEach(vm.share.storage, function(value, key) {
          if(value) {
            vm.share.sizegb += fileSizeArray[key]; 
          }
        });
        var years = dateDiffInYears(vm.project.startDate, vm.project.endDate);

        years = years ? years : 1;
        console.log(years)
        vm.share.cost = vm.share.sizegb * 1 * years;
    }
  
      // Remove existing Article
      function remove() {
        if ($window.confirm('Are you sure you want to delete?')) {
          vm.article.$remove(function () {
            $state.go('shares.list');
            Notification.success({ message: '<i class="glyphicon glyphicon-ok"></i> Article deleted successfully!' });
          });
        }
      }

      function checkUserIdsSpecified() {
        if (vm.readOnly.length == 0) {
          Notification.error({ message: 'Please specify at least on user In Read Only field.', title: '<i class="glyphicon glyphicon-remove"></i> Share save error!' });
          return false;
        }
        
        if (vm.readAndWrite.length == 0) {
          Notification.error({ message: 'Please specify at least on user In Read And Write field.', title: '<i class="glyphicon glyphicon-remove"></i> Share save error!' });
          return false;
        }

        if (vm.readWriteAndModify.length <= 1) {
          Notification.error({ message: 'Minimum 2 users required In Read Write and Modify field.', title: '<i class="glyphicon glyphicon-remove"></i> Share save error!' });
          return false;
        }
        return true;
        
      }
  
      // Save Share
      function save(isValid) {
        if (!isValid) {
          $scope.$broadcast('show-errors-check-validity', 'vm.form.shareForm');
          return false;
        }
        if (!checkUserIdsSpecified()) {
          return false;
        }

        var keyArray =  vm.readOnly.map(function(item) { return item["id"]; });
        vm.share.readOnly = keyArray.join(';');

        keyArray =  vm.readAndWrite.map(function(item) { return item["id"]; });
        vm.share.readAndWrite = keyArray.join(';');

        keyArray =  vm.readWriteAndModify.map(function(item) { return item["id"]; });
        vm.share.readWriteAndModify = keyArray.join(';');

        //set the new value for share if selected category is resize
        if (vm.share.category == 'resize') {
          vm.share.newSizegb = vm.availableSize + vm.incrementGb
        }


        //set the new value for share if selected category is resize
        if (vm.share.category == 'resize') {
          vm.share.newSizegb = vm.availableSize + vm.incrementGb
        }
  
        // Create a new share, or update the current instance
        vm.share.createOrUpdate()
          .then(successCallback)
          .catch(errorCallback);
  
        function successCallback(res) {
          $state.go('shares.list'); // should we send the User to the list or the updated Article's view?
          Notification.success({ message: '<i class="glyphicon glyphicon-ok"></i> Share saved successfully!' });
        }
  
        function errorCallback(res) {
          Notification.error({ message: res.data.message, title: '<i class="glyphicon glyphicon-remove"></i> Share save error!' });
        }
      }
    }
  }());
  