(function () {
    'use strict';
  
    angular
      .module('shares')
      .controller('SharesController', SharesController);
  
    SharesController.$inject = ['$scope', '$state', '$window', 'shareResolve', 'Authentication', 'Notification', 'projectResolve'];
  
    function SharesController($scope, $state, $window, share, Authentication, Notification, projectInfo) {
      var vm = this;
        
      vm.share = share;
      vm.share.city = vm.share.city || projectInfo.city
      vm.share.projectCode = vm.share.projectCode || projectInfo.txtibucode
      vm.share.storage = vm.share.storage || {}
      vm.project = projectInfo
      if ( projectInfo) {
        vm.project.startDate = new Date(projectInfo.startDate)
        vm.project.endDate = new Date(projectInfo.endDate)
      }
      
      vm.authentication = Authentication;
      vm.form = {};
      vm.remove = remove;
      vm.save = save;

      $scope.categories = [
        {"value": "newShare", "name": "New Project Share Creation"},
        {"value": "changePermission", "name": "Change Permission"},
        {"value": "resize", "name": "Resize Project Share"},
        {"value": "rename", "name": "Rename Project Share"},
        {"value": "restoreProjectShare", "name": "Retire Project Share"},
        {"value": "retireVolumeWorkflow", "name": "Retire Volume Workflow"},
        {"value": "migration", "name": "Project Migration Workflow"}
      ];

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

    
     $scope.calculateCapacity = function() {
        var fileSizeArray = {
          "officeFile":5,
          "compressedFile":4,
          "dataAndDBFile":10,
          "executableFile":7,
          "imageFile": 3,
          "programmingFile":3,
          "videoFile":10,
          "audioFile":4,
          "backupFile":10
        }

        vm.share.sizegb = 0;

        if (vm.share.storage.backupFile) {
          vm.share.sizegb += fileSizeArray["backupFile"]
        }
        if (vm.share.storage.audioFile) {
          vm.share.sizegb += fileSizeArray["audioFile"]
        }
        if (vm.share.storage.videoFile) {
          vm.share.sizegb += fileSizeArray["videoFile"]
        }
        if (vm.share.storage.programmingFile) {
          vm.share.sizegb += fileSizeArray["programmingFile"]
        }
        if (vm.share.storage.imageFile) {
          vm.share.sizegb += fileSizeArray["imageFile"]
        }
        if (vm.share.storage.executableFile) {
          vm.share.sizegb += fileSizeArray["executableFile"]
        }
        if (vm.share.storage.dataAndDBFile) {
          vm.share.sizegb += fileSizeArray["dataAndDBFile"]
        }
        if (vm.share.storage.compressedFile) {
          vm.share.sizegb += fileSizeArray["compressedFile"]
        }
        if (vm.share.storage.officeFile) {
          vm.share.sizegb += fileSizeArray["officeFile"]
        }

        var years = dateDiffInYears(vm.project.startDate, vm.project.endDate);

        years = years ? years : 1

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
  
      // Save Share
      function save(isValid) {
        if (!isValid) {
          $scope.$broadcast('show-errors-check-validity', 'vm.form.shareForm');
          return false;
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
            console.log("here in error")
          Notification.error({ message: res.data.message, title: '<i class="glyphicon glyphicon-remove"></i> Share save error!' });
        }
      }
    }
  }());
  