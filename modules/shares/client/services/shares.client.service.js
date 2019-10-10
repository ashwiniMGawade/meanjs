(function () {
    'use strict';
  
    angular
      .module('shares.services')
      .factory('SharesService', SharesService);
  
    SharesService.$inject = ['$resource', '$log'];
  
    function SharesService($resource, $log) {
      var Share = $resource('/storage/api/shares/:shareId', {
        shareId: '@_id'
      }, {
        query: {
          method: 'GET',
          isArray: false,
        },
        update: {
          method: 'PUT'
        },
        getCifsShareDetails: {
          method: 'GET',
          url: '/storage/api/shares/getCifsShareDetails'
        },
        getNewShareProcessingDetails: {
          method: 'GET',
          url:'/storage/api/shares/getNewShareProcessingDetails',
          isArray: true
        },
        getCifsShareACLGroups: {
          method: 'GET',
          url: '/storage/api/shares/getCifsShareACLGroups',
          isArray: true
        },
        listStatus: {
          method: 'GET',
          url: '/storage/api/shares/listStatus',
          isArray: true
        },
        updateRequest: {
          method: 'PUT',
          params: {
            shareId:'@shareId',
            action: '@action'
          },
          url: '/storage/api/shares/:shareId/:action'
        }
      });
  
      angular.extend(Share.prototype, {
        createOrUpdate: function () {
          var share = this;
          console.log(share)
          return createOrUpdate(share);
        }
      });
  
      return Share;
  
      function createOrUpdate(share) {
        if (share._id) {
          return share.$update(onSuccess, onError);
        } else {
          return share.$save(onSuccess, onError);
        }
  
        // Handle successful response
        function onSuccess(share) {
          // Any required internal processing from inside the service, goes here.
        }
  
        // Handle error response
        function onError(errorResponse) {
          var error = errorResponse.data;
          // Handle error internally
          handleError(error);
        }
      }
  
      function handleError(error) {
        // Log error
        $log.error(error);
      }
    }
  }());
  