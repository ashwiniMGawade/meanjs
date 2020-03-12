(function () {
    'use strict';
  
    angular
      .module('shares')
      .controller('SharesController', SharesController);
      
  
    SharesController.$inject = ['$scope', '$state', '$window', 'shareResolve', 'Authentication', 'Notification', 'projectResolve',  'SharesService',  'UsersService', 'SettingsService','modalService', '$sanitize', '$filter'];
  
    function SharesController($scope, $state, $window, share, Authentication, Notification, projectInfo,  SharesService, UsersService,  SettingsService, modalService, $sanitize, $filter) {
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

        vm.showError = function(err, redirect) {
          if(redirect === undefined) {
            redirect = false;
          }
          var modalOptions = {
            closeButtonText: 'Cancel',
            actionButtonText: 'Ok',
            headerText: '<span class="text-danger"><span class="glyphicon glyphicon-alert" aria-hidden="true"></span>&nbsp;&nbsp;Error!</span>',
            bodyText: ['<div class="alert alert-danger">'+err+'</div>'],
            showCancel:false
          };
          modalService.showModal({}, modalOptions).then(function (result) {
            if (redirect) {
              $state.go('home');
            }
          });
        }
    
        vm.showWarning = function(err, redirect) {
          if(redirect === undefined) {
            redirect = false;
          }
          var modalOptions = {
            closeButtonText: 'Cancel',
            actionButtonText: 'Ok',
            headerText: '<span class="text-warning"><span class="glyphicon glyphicon-alert" aria-hidden="true"></span> Warning !</span>',
            bodyText: ['<div class="alert alert-warning">'+err+'</div>'],
            showCancel:false
          };
          modalService.showModal({}, modalOptions).then(function (result) {
            if (redirect) {
              $state.go('home');
            }
          });
        }

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
        vm.project = projectInfo;
        vm.cifShareDetails = {};
        vm.readLoader = vm.readWriteLoader = vm.readWriteAndModifyLoader =  vm.useridsLoader = false;
        vm.aclGroupLoader = false;
        vm.IsLoggedInUserInCC = false;

        vm.resetAllChangePermissions = function() {
          vm.acl_users = [];
          vm.aclUserGroup = [];
          if(vm.share.acl_group) {
            vm.checkForUsersToRemove()
          }
        }

      
      vm.getUsers = function( filterVal, element) {
		    vm[element] = true;
        UsersService.getUsers({
          search: filterVal,
          projectCode:projectInfo.projectcode,
        }).$promise.then(function(res) {
    			vm[element] = false;
    			vm.users = res
        });
      }

      vm.costPerGb = 1;

      //get the cost as per location
      var getCostPerGb = function() {
        SettingsService.query({  
          'location':projectInfo.city        
        } ,function (data) {
          var locationSettings = data.settings[0];
          if (locationSettings) {
            vm.costPerGb = locationSettings.space*1024 / ( locationSettings.cost);
            vm.costPerGb = $filter('number')(vm.costPerGb, 2)
          }
        });
      }

      var getListOfLocations = function() {
        SettingsService.query({     
        } ,function (data) {
         vm.locations = data.settings;
        });
      }

      vm.checkForUsersToRemove = function() {
        if (vm.share.operation == "removeUserFromADGroup" && vm.share.acl_group) {
          vm.getACLGroupUsers("", "useridsLoader");
        } else if (vm.share.operation == "addUserToADGroup" && vm.share.acl_group) {
          vm.getUsers("", "useridsLoader");
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
          search: filterVal,
          projectCode:projectInfo.projectcode,
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
      vm.volumes = [];

      vm.listVolumes = function() {
        SharesService.listVolumes({
          location: vm.share.city
        }).$promise.then(function(res) {
          vm.volumes = res
        });
      }


      if ( projectInfo) {
        //validate the projectcode
        var projectEndDate = new Date(projectInfo.endDate);
       if (projectEndDate < new Date()) {
        vm.showError("Your project with code '"+projectInfo.txtibucode+"' is expired, please get it validated!", true)
       }
        //check existing request under processing state exist for the new project share creation
        SharesService.getNewShareProcessingDetails({
          'bu': projectInfo.txtibucode,
          'projectCode': projectInfo.projectcode, 
          'location':projectInfo.city
        }).$promise.then(function(res) {
          var showProcessingWarning = false;
          var completedReqExistWarning = false
          res.forEach(function(row) {
            if (row._id == "Processing" && row.count > 0) {
              showProcessingWarning = true;
            }
            if (row._id == "Completed" && row.count > 0) {
              completedReqExistWarning = true;
            }
          })
           if(showProcessingWarning) {
              vm.showWarning("New Project share creation request for project '"+projectInfo.txtibucode+"' is being processed. Please wait for it to be completed, to perform more operations on it.", true)
           } else {
            vm.aclGroupLoader  = true;
            vm.showPage = false;
            getCostPerGb();
            SharesService.getCifsShareDetails({
              'volname': projectInfo.txtibucode,
              'sharename': projectInfo.projectcode, 
              'location':projectInfo.city
            }).$promise.then(function(res) {
              vm.showPage = true;
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
                  IfLoggedInUserIsInCC();
                });
              }  
              // else if(completedReqExistWarning) {
              //   vm.showWarning("New Project share creation request for project '"+projectInfo.txtibucode+"' is already completed. Please wait for some time to sync the data, to perform more operations on it.", true)
              // }
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
        });    
		    
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

      if (vm.isAdmin) {
       getListOfLocations();
      }

      vm.categories = sharedConfig.share.categories;
      vm.allowedOperations = sharedConfig.share.allowedChangePermissionOperations;
      vm.allowedPermissions = sharedConfig.share.allowedPermissions;
	    vm.allowedACLTypes= sharedConfig.share.allowedACLTypes;

      vm.toggleActions = function() {
        vm.showActions = !vm.showActions;
      }
      
      
      vm.getFilteredCategories = function() {
        var keyNewShareCat = 'newShare';
        var keRretireVolWfcat = 'retireVolumeWorkflow'
        var keyNewVolumeCat = 'newVolume';
        var obj = {};
        if (vm.cifShareDetails.sharepath) {
          obj = Object.assign({}, vm.categories);
          delete obj[keyNewShareCat];
          if(!vm.isAdmin) {
            delete obj[keRretireVolWfcat];
            delete obj[keyNewVolumeCat];
          }
          return obj;
         } else {          
          obj[keyNewShareCat] = vm.categories[keyNewShareCat];
          if(!vm.isAdmin) {
            vm.share.category = keyNewShareCat;
          } else {
            obj[keyNewVolumeCat] = vm.categories[keyNewVolumeCat];
          }
         
          return obj;
        }  
        //return vm.categories;
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

    vm.approve = function(isValid) {
      if (!isValid) {
        $scope.$broadcast('show-errors-check-validity', 'shareForm');
        return false;
      }
      var modalOptions = {
        closeButtonText: 'Cancel',
        actionButtonText: 'Ok',
        headerText: 'Approve request?',
        bodyText: ['Are you sure you want to approve this request?']
      };

      modalService.showModal({}, modalOptions).then(function (result) {
        SharesService.updateRequest({shareId: vm.share._id, action: 'approve'}, {"comment": $sanitize(vm.comment)})
        .$promise.then(function (response) {
          console.log(response);
          Notification.success({
            message: '<i class="glyphicon glyphicon-ok"></i>Request is successfully approved will take some time to process the request!',
            positionX: 'center',
            positionY: 'top'
          });
           setTimeout(function() {$state.go('shares.list')}, 1000);
        });
      });
    }


    vm.reject = function(isValid) {
      if (!isValid) {
        $scope.$broadcast('show-errors-check-validity', 'shareForm');
        return false;
      }
      var modalOptions = {
        closeButtonText: 'Cancel',
        actionButtonText: 'Ok',
        headerText: 'Reject request?',
        bodyText: ['Are you sure you want to reject this request?']
      };
      modalService.showModal({}, modalOptions).then(function (result) {
        SharesService.updateRequest({shareId: vm.share._id, action: 'reject'})
        .$promise.then(function (response) {
          console.log(response);
          Notification.success({
            message: '<i class="glyphicon glyphicon-ok"></i>Request is  successfully rejected!',
            positionX: 'center',
            positionY: 'top' 
          });
          setTimeout(function() {$state.go('shares.list')}, 1000);
        });
      });
    }
    
    $scope.calculateCapacity = function() {
        vm.share.cost = vm.share.sizegb * vm.costPerGb;
        vm.share.cost = $filter('number')(vm.share.cost, 2)
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
          vm.showError('Please specify at least one user In Read Only field.');
          // Notification.error({
          //   message: 'Please specify at least one user In Read Only field.',
          //   title: '<i class="glyphicon glyphicon-remove"></i> Share save error!',
          //   delay: 10000,
          //   positionX: 'center',
          //   positionY: 'top'
          // });
          return false;
        }
        
        if (vm.readAndWrite.length == 0) {
          vm.showError('Please specify at least one user In Read And Write field.');
          // Notification.error({
          //   message: 'Please specify at least one user In Read And Write field.',
          //   title: '<i class="glyphicon glyphicon-remove"></i> Share save error!',
          //   delay: 10000,
          //   positionX: 'center',
          //   positionY: 'top'
          // });
          return false;
        }

        if (vm.readWriteAndModify.length <= 1) {
          vm.showError('Minimum 2 users required In Read Write and Modify field.');
          // Notification.error({ 
          //   message: 'Minimum 2 users required In Read Write and Modify field.',
          //   title: '<i class="glyphicon glyphicon-remove"></i> Share save error!',
          //    delay: 10000,
          //   positionX: 'center',
          //   positionY: 'top'
          // });
          return false;
        }

        if (!vm.share.sizegb) {
          vm.showError('Please enter the storage size requirement.');
          // Notification.error({ 
          //   message: 'Please select file types from storage requirement.',
          //   title: '<i class="glyphicon glyphicon-remove"></i> Share save error!',
          //    delay: 10000,
          //   positionX: 'center',
          //   positionY: 'top'
          // });
          return false;
        }
        return true;
        
      }

      function IfLoggedInUserIsInCC() {
        var acl_groups = $filter('filter')(vm.aclGroups, vm.cifShareDetails.sharename);
        console.log(acl_groups);
        var cc_groupname 
        angular.forEach(acl_groups, function(item) {
          var str = item.groupName.substr(item.groupName.length - 2);
          console.log(str);
          if (str == "CC") {
            cc_groupname = item.groupName;
          }				
        });
        UsersService.getACLGroupUsers({
          search: "",
          group: cc_groupname
        }).$promise.then(function(res) {
          console.log(res);
          var userFound = $filter('filter')(res, {sAMAccountName: Authentication.user.username, displayName: Authentication.user.displayName});
          if (userFound.length > 0) {
            vm.IsLoggedInUserInCC = true
          }
        });
      
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
          vm.share.IsLoggedInUserInCC = vm.IsLoggedInUserInCC;
          if (vm.acl_users.length == 0) {
            vm.showError('Please specify at least one user in UserIds.');
            // Notification.error({
            //   message: 'Please specify at least on user in UserIds.',
            //   title: '<i class="glyphicon glyphicon-remove"></i> Share save error!',
            //   delay: 10000,
            //   positionX: 'center',
            //   positionY: 'top'
            // });
            return false;
          }
          
          keyArray =  vm.acl_users.map(function(item) { return item["id"]; });
          vm.share.acl_users = keyArray.join(';');
        }
		
		    if (vm.share.category == 'changePermission' &&  vm.share.operation == 'addUserOrGroupToShare') {
             if (vm.aclUserGroup.length == 0) 
             {
              vm.showError('Please specify user/group to add.');
              // Notification.error({
              //   message: 'Please specify user/group to add.',
              //   title: '<i class="glyphicon glyphicon-remove"></i> Share save error!',
              //   delay: 10000,
              //   positionX: 'center',
              //   positionY: 'top'
              // });
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
        vm.showError(res.data.message);
        // Notification.error({ 
        //   message: res.data.message, 
        //   title: '<i class="glyphicon glyphicon-remove"></i> Share save error!',
        //   delay: 10000,
        //   positionX: 'center',
        //   positionY: 'top' });
      }

     function fix (isValid) {
      if (!isValid) {
        $scope.$broadcast('show-errors-check-validity', 'vm.form.shareForm');
        return false;
      }
      var share = vm.share;
      share.fromFix = "true";
      SharesService.updateRequest(
        {shareId: vm.share._id, action: 'fix'},
        {"comment": $sanitize(vm.comment), "status": vm.share.status, "volumeName": vm.volumeName}
        ).$promise.then(function () {
            $state.go('shares.list');
            Notification.success({
              message: '<i class="glyphicon glyphicon-ok"></i>Request is successfully updated!',
              positionX: 'center',
              positionY: 'top' 
            });
          });
     }

    }
  }());
  