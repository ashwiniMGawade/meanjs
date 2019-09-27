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

      if (typeof Object.assign != 'function') {
        Object.assign = function(target) {
          'use strict';
          if (target == null) {
            throw new TypeError('Cannot convert undefined or null to object');
          }

          target = Object(target);
          for (var index = 1; index < arguments.length; index++) {
            var source = arguments[index];
            if (source != null) {
              for (var key in source) {
                if (Object.prototype.hasOwnProperty.call(source, key)) {
                  target[key] = source[key];
                }
              }
            }
          }
          return target;
        };
      }
      
      /**reference from http://dotansimha.github.io/angularjs-dropdown-multiselect/docs/#/main */
        vm.readOnlyAndWritesettings = { 
          enableSearch: true, 
          idProp: 'sAMAccountName',
          displayProp: 'displayName',
          scrollableHeight: '200px',
          scrollable: true,
          showCheckAll:false,
          showUncheckAll:false,
          groupByTextProvider: function(groupValue) { 
            if (groupValue === 'user') { return 'Users'; } else { return 'Groups'; } 
          },
          clearSearchOnClose:true,
          closeOnSelect: true,
          //smartButtonMaxItems: 4,
          selectedToTop:true,
          //smartButtonTextConverter: function(itemText, originalItem) { 
            //return itemText;
          //}
        };

        vm.readOnly = [];
        vm.readAndWrite = [];
        vm.readWriteAndModify = [];
        vm.acl_users = [];
    		vm.aclUserGroup = [];

        vm.readWriteAndModifysettings = { 
          enableSearch: true, 
          idProp: 'sAMAccountName',
          displayProp: 'displayName',
          scrollableHeight: '200px',
          scrollable: true,
          showCheckAll:false,
          showUncheckAll:false,
          clearSearchOnClose:true,
          closeOnSelect: true,
          groupByTextProvider: function(groupValue) { 
            if (groupValue === 'user') { return 'Users'; } else { return 'Groups'; } 
          },
          //smartButtonMaxItems: 2,
		     //selectionLimit: 2,
          selectedToTop:true,
          //smartButtonTextConverter: function(itemText, originalItem) { 
            //return itemText;
          //}
        };
		
		    vm.useridSettings = { 
          enableSearch: true, 
          idProp: 'sAMAccountName',
          displayProp: 'displayName',          
          scrollableHeight: '200px',
          scrollable: true,
          showCheckAll:false,
          showUncheckAll:false,
          selectedToTop:true,
          clearSearchOnClose:true,
          closeOnSelect: true,
        };
		
		    vm.acluserGroupSettings = { 
          enableSearch: true, 
          idProp: 'sAMAccountName',
          displayProp: 'displayName',          
          scrollableHeight: '200px',
          scrollable: true,
          showCheckAll:false,
          showUncheckAll:false,
          smartButtonMaxItems: 2,
		      selectionLimit: 1,
          selectedToTop:true,
          clearSearchOnClose:true,
          closeOnSelect: true,
          smartButtonTextConverter: function(itemText, originalItem) { 
            return itemText;
          },
          groupByTextProvider: function(groupValue) { 
            if (groupValue === 'user') { return 'Users'; } else { return 'Groups'; } 
          },
        };
		
        vm.userDropdownInitEvents = {
          'onInitDone': function() {
            var directiveScope =  angular.element(document.querySelector('.readUsers .multiselect-parent')).scope();
            directiveScope.$watch('input.searchFilter', function(newVal, oldVal) {
              if (newVal !== oldVal && newVal != '' && newVal.length > 3) {
                vm.getUsersAndGroups(newVal, "readLoader");
              }
              
            });   
          },
          'onItemSelect': function() {
            var directiveScope =  angular.element(document.querySelector('.readUsers .multiselect-parent')).scope();
            directiveScope.input.searchFilter = "";
          }
		    }
        
		
		
        vm.userDropdownRWInitEvents = {
            'onInitDone': function() {
              var directiveScope =  angular.element(document.querySelector('.readWriteUsers .multiselect-parent')).scope();
              directiveScope.$watch('input.searchFilter', function(newVal, oldVal) {
                if (newVal !== oldVal && newVal != '' && newVal.length > 3) {
                  vm.getUsersAndGroups(newVal , "readWriteLoader");
                }
                
              });   
            },
            'onItemSelect': function() {
              var directiveScope =  angular.element(document.querySelector('.readWriteUsers .multiselect-parent')).scope();
              directiveScope.input.searchFilter = "";
            }
          }

        vm.userDropdownRWMInitEvents = {
            'onInitDone': function() {
              var directiveScope =  angular.element(document.querySelector('.readWriteAndModifyUsers .multiselect-parent')).scope();
              directiveScope.$watch('input.searchFilter', function(newVal, oldVal) {
                if (newVal !== oldVal && newVal != '' && newVal.length > 3) {
                  vm.getUsersAndGroups(newVal, "readWriteAndModifyLoader");
                }
                
              });   
            },
            'onItemSelect': function() {
              var directiveScope =  angular.element(document.querySelector('.readWriteAndModifyUsers .multiselect-parent')).scope();
              directiveScope.input.searchFilter = "";
            }
          }
		
		
    	  vm.userDropdownUseridInitEvents = {
            'onInitDone': function() {
              var directiveScope =  angular.element(document.querySelector('.userids .multiselect-parent')).scope();
              directiveScope.$watch('input.searchFilter', function(newVal, oldVal) {
                if (newVal !== oldVal && newVal != '' && newVal.length > 3) {
                  if (vm.share.operation == "removeUserFromADGroup") {
                     vm.getACLGroupUsers(newVal, "useridsLoader");
                  } else {
                     vm.getUsers(newVal, "useridsLoader");
                   }                 
                }
                
              });   
            },
            'onItemSelect': function() {
              var directiveScope =  angular.element(document.querySelector('.userids .multiselect-parent')).scope();
              directiveScope.input.searchFilter = "";
            }
        }
		
	      vm.userDropdownaclUserGroupInitEvents = {
          'onInitDone': function() {
            var directiveScope =  angular.element(document.querySelector('.acluserGroup .multiselect-parent')).scope();
            directiveScope.$watch('input.searchFilter', function(newVal, oldVal) {
              if (newVal !== oldVal && newVal != '' && newVal.length > 3) {
                vm.getUsersAndGroups(newVal, "acluserGroupLoader");
              }
              
            });   
          },
          'onItemSelect': function() {
            var directiveScope =  angular.element(document.querySelector('.acluserGroup .multiselect-parent')).scope();
            directiveScope.input.searchFilter = "";
          }
        }
          
        vm.defaultUserSelectionText = {
          buttonDefaultText: 'Select Users/Groups From the List',
          dynamicButtonTextSuffix: "Selected, Select more Users/Groups",
        };

        vm.defaultOnlyUserSelectionText = {
          buttonDefaultText: 'Select Users From the List',
          dynamicButtonTextSuffix: "Selected, Select more Users",
        };

        vm.defaultSingleUserGroupSelectionText = {
          buttonDefaultText: 'Select User/Group From the List',
          dynamicButtonTextSuffix: "Selected, Select different user",
        };

        vm.customFilter = '';

        vm.share = share; 

        vm.aclGroups = [];  
        vm.share.storage = vm.share.storage || {}
        vm.project = projectInfo;
        vm.cifShareDetails = {};
        vm.readLoader = vm.readWriteLoader = vm.readWriteAndModifyLoader =  vm.useridsLoader = false;
        vm.aclGroupLoader = false;

        vm.resetAllChangePermissions = function() {
          vm.acl_users = [];
          vm.aclUserGroup = [];
        }

      
      vm.getUsers = function( filterVal, element) {
		    vm[element] = true;
        UsersService.getUsers({
          search: filterVal
        }).$promise.then(function(res) {
    			vm[element] = false;
    			vm.users = res
        });
      }

      vm.checkForUsersToRemove = function() {
        if (vm.share.operation == "removeUserFromADGroup" && vm.share.acl_group) {
          vm.getACLGroupUsers("", "useridsLoader");
        }
      }

      vm.getACLGroupUsers = function( filterVal, element) {
        vm[element] = true;
        UsersService.getACLGroupUsers({
          search: filterVal,
          group: vm.share.acl_group
        }).$promise.then(function(res) {
          vm[element] = false;
          vm.users = res
        });
      }

      vm.getUsersAndGroups = function( filterVal, element) {
        vm[element] = true;
        UsersService.getUsersAndGroups({
          search: filterVal
        }).$promise.then(function(res) {
          vm[element] = false;
          vm.usersAndGroups = res
        });
      }

      vm.listStatus = function() {
        SharesService.listStatus().$promise.then(function(res) {
          vm.validStatusesToAssign = res.filter(function(status) {
            return (status == 'Processing' || status == 'Pending Approval') ? false: true;
          });
        });
      }
    
      if ( projectInfo) {
		   vm.aclGroupLoader  = true;
        SharesService.getCifsShareDetails({
          'volname': projectInfo.txtibucode,
          'sharename': projectInfo.projectcode, 
          'location':projectInfo.city
        }).$promise.then(function(res) {
          vm.cifShareDetails = res;
          vm.usedsizegb = vm.cifShareDetails.usedGB || 0;
          vm.allocatedSize = vm.cifShareDetails.hardLimit || 0;
          vm.availableSize = vm.allocatedSize - vm.usedsizegb;
          //get groups for existing cifs share
          if (vm.cifShareDetails.sharename) {
            vm.share.category = '';
            SharesService.getCifsShareACLGroups({
              'sharename': vm.cifShareDetails.sharename
            }).$promise.then(function(res) {
              vm.aclGroups = res;
			        vm.aclGroupLoader  = false;
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
        vm.getUsersAndGroups(vm.customFilter);	  
        vm.getUsers(vm.customFilter);    
    }

      vm.removeItem = function(array, elementId){
        console.log(typeof array);
        array.splice(elementId, 1);
      }

      
      vm.authentication = Authentication;
      vm.isAdmin = Authentication.user.roles.indexOf('admin') != -1;
      vm.form = {};
      vm.remove = remove;
      vm.save = save;
      vm.showActions = false;
      vm.fix=fix;

      vm.categories = sharedConfig.share.categories;
      vm.allowedOperations = sharedConfig.share.allowedChangePermissionOperations;
      vm.allowedPermissions = sharedConfig.share.allowedPermissions;
	    vm.allowedACLTypes= sharedConfig.share.allowedACLTypes;
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
          vm.share.category = keyNewShareCat;
          return obj;
        }  
       // return vm.categories;
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
         
          Notification.success({
            message: '<i class="glyphicon glyphicon-ok"></i>Request is successfully approved will take some time to process the request!',
            positionX: 'center',
            positionY: 'top' });
        });
        $state.go('shares.list');
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
        SharesService.updateRequest({shareId: vm.share._id, action: 'reject'}, function (response) {
          console.log(response);
          $state.go('shares.list');
          Notification.success({
            message: '<i class="glyphicon glyphicon-ok"></i>Request is  successfully rejected!',
            positionX: 'center',
            positionY: 'top' });
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

    $scope.getYearDiff = function() {
      var years = dateDiffInYears(vm.project.startDate, vm.project.endDate);
      return years;
    }
  
      // Remove existing Article
      function remove() {
        if ($window.confirm('Are you sure you want to delete?')) {
          vm.article.$remove(function () {
            $state.go('shares.list');
            Notification.success({
              message: '<i class="glyphicon glyphicon-ok"></i> Article deleted successfully!',
              positionX: 'center',
              positionY: 'top' });
          });
        }
      }

      function checkUserIdsSpecified() {
        if (vm.readOnly.length == 0) {
          Notification.error({
            message: 'Please specify at least one user In Read Only field.',
            title: '<i class="glyphicon glyphicon-remove"></i> Share save error!',
            delay: 10000,
            positionX: 'center',
            positionY: 'top'
          });
          return false;
        }
        
        if (vm.readAndWrite.length == 0) {
          Notification.error({
            message: 'Please specify at least one user In Read And Write field.',
            title: '<i class="glyphicon glyphicon-remove"></i> Share save error!',
            delay: 10000,
            positionX: 'center',
            positionY: 'top'
          });
          return false;
        }

        if (vm.readWriteAndModify.length <= 1) {
          Notification.error({ 
            message: 'Minimum 2 users required In Read Write and Modify field.',
            title: '<i class="glyphicon glyphicon-remove"></i> Share save error!',
             delay: 10000,
            positionX: 'center',
            positionY: 'top'
          });
          return false;
        }

        if (!vm.share.sizegb) {
          Notification.error({ 
            message: 'Please select file types from storage requirement.',
            title: '<i class="glyphicon glyphicon-remove"></i> Share save error!',
             delay: 10000,
            positionX: 'center',
            positionY: 'top'
          });
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

        if (vm.share.category == 'newShare') {
          if (!checkUserIdsSpecified()) {
            return false;
          }

          var keyArray =  vm.readOnly.map(function(item) { return item["id"]; });
          vm.share.readOnly = keyArray.join(';');

          keyArray =  vm.readAndWrite.map(function(item) { return item["id"]; });
          vm.share.readAndWrite = keyArray.join(';');

          keyArray =  vm.readWriteAndModify.map(function(item) { return item["id"]; });
          vm.share.readWriteAndModify = keyArray.join(';');

        }

        if (vm.share.category == 'changePermission' &&  (vm.share.operation == 'addUserToADGroup' || vm.share.operation == 'removeUserFromADGroup')) {
          if (vm.acl_users.length == 0) {
            Notification.error({
              message: 'Please specify at least on user in UserIds.',
              title: '<i class="glyphicon glyphicon-remove"></i> Share save error!',
              delay: 10000,
              positionX: 'center',
              positionY: 'top'
            });
            return false;
          }
          keyArray =  vm.acl_users.map(function(item) { return item["id"]; });
          vm.share.acl_users = keyArray.join(';');
        }
		
		    if (vm.share.category == 'changePermission' &&  vm.share.operation == 'addUserOrGroupToShare') {
             if (vm.aclUserGroup.length == 0) 
             {
              Notification.error({
                message: 'Please specify user/group to add.',
                title: '<i class="glyphicon glyphicon-remove"></i> Share save error!',
                delay: 10000,
                positionX: 'center',
                positionY: 'top'
              });
               return false;
             }
             keyArray =  vm.aclUserGroup.map(function(item) { return item["id"]; });
             vm.share.userOrGroupName = keyArray.join('');            
        }


        //set the new value for share if selected category is resize
        if (vm.share.category == 'resize') {
          vm.share.newSizegb = vm.availableSize + vm.incrementGb
        }
  
        // Create a new share, or update the current instance
        vm.share.createOrUpdate()
          .then(successCallback)
          .catch(errorCallback);
  
       
      }

     function successCallback(res) {
        $state.go('shares.list'); // should we send the User to the list or the updated Article's view?
        Notification.success({
          message: '<i class="glyphicon glyphicon-ok"></i> Share saved successfully!',
          positionX: 'center',
          positionY: 'top'
        });
      }

      function errorCallback(res) {
        Notification.error({ 
          message: res.data.message, 
          title: '<i class="glyphicon glyphicon-remove"></i> Share save error!',
          delay: 10000,
          positionX: 'center',
          positionY: 'top' });
      }

     function fix () {
      var share = vm.share;
      share.fromFix = "true";
      SharesService.updateRequest({shareId: vm.share._id, action: 'fix'}, {"comment": $sanitize(vm.comment), "status": vm.share.status} ,function () {
            $state.go('shares.list');
            Notification.success({
              message: '<i class="glyphicon glyphicon-ok"></i>Request is successfully updated!',
              positionX: 'center',
              positionY: 'top' });
          });
     }

    }
  }());
  