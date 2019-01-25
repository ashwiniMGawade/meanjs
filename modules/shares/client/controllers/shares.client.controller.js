(function () {
    'use strict';
  
    angular
      .module('shares')
      .controller('SharesController', SharesController);
  
    SharesController.$inject = ['$scope', '$state', '$window', 'shareResolve', 'Authentication', 'Notification', 'projectResolve'];
  
    function SharesController($scope, $state, $window, share, Authentication, Notification, projectInfo) {
      var vm = this;
        
      vm.share = share;
      vm.share.readOnly = vm.share.readOnly ||(projectInfo.dm). trim() + "@infosys.com";
      vm.share.readAndWrite = vm.share.readAndWrite || (projectInfo.pm).trim() + "@infosys.com";
      vm.project = projectInfo
      vm.authentication = Authentication;
      vm.form = {};
      vm.remove = remove;
      vm.save = save;

      $scope.categories = [{"name": "test1", value: "test1"}, {"name": "test2", value: "test2"}];


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

        vm.share.size = 0;

        if (vm.share.backupFile) {
          vm.share.size += fileSizeArray["backupFile"]
        }
        if (vm.share.audioFile) {
          vm.share.size += fileSizeArray["audioFile"]
        }
        if (vm.share.videoFile) {
          vm.share.size += fileSizeArray["videoFile"]
        }
        if (vm.share.programmingFile) {
          vm.share.size += fileSizeArray["programmingFile"]
        }
        if (vm.share.imageFile) {
          vm.share.size += fileSizeArray["imageFile"]
        }
        if (vm.share.executableFile) {
          vm.share.size += fileSizeArray["executableFile"]
        }
        if (vm.share.dataAndDBFile) {
          vm.share.size += fileSizeArray["dataAndDBFile"]
        }
        if (vm.share.compressedFile) {
          vm.share.size += fileSizeArray["compressedFile"]
        }
        if (vm.share.officeFile) {
          vm.share.size += fileSizeArray["officeFile"]
        }

        vm.share.cost = vm.share.size * 1;
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
  