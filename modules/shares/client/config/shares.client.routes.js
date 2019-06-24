(function () {
    'use strict';
  
    angular
      .module('shares.routes')
      .config(routeConfig);
  
    routeConfig.$inject = ['$stateProvider'];
  
    function routeConfig($stateProvider) {
      $stateProvider
        .state('shares', {
          abstract: true,
          url: '/shares',
          template: '<ui-view/>'
        })
        .state('shares.list', {
          url: '',
          templateUrl: 'modules/shares/client/views/list-shares.client.view.html',
          controller: 'SharesListController',
          controllerAs: 'vm'
        })
        .state('shares.create', {
            url: '/create',
            templateUrl: 'modules/shares/client/views/form-share.client.view.html',
            controller: 'SharesController',
            controllerAs: 'vm',
            data: {
              roles: ['admin', 'user']
            },
            resolve: {
              shareResolve: newShare,
              projectResolve: getUserProjectInfo,
              // getCifsShareDetails: getCifsShareDetails
            }
        })
        .state('shares.view', {
          url: '/:shareId',
          templateUrl: 'modules/shares/client/views/view-share.client.view.html',
          controller: 'SharesController',
          controllerAs: 'vm',
          resolve: {
            shareResolve: getShare,
            projectResolve: function() {return null},
            // getCifsShareDetails: function() {return null}
          },
          data: {
            pageTitle: 'Share Details'
          }
        });
    }
  
    getShare.$inject = ['$stateParams', 'SharesService'];
  
    function getShare($stateParams, SharesService) {
      return SharesService.get({
        shareId: $stateParams.shareId
      }).$promise;
    }

    newShare.$inject = ['SharesService'];

    function newShare(SharesService) {
        return new SharesService();
    }

    getUserProjectInfo.$inject = ['$stateParams','UsersService'];

    function getUserProjectInfo($stateParams, UsersService) {
        return UsersService.getUserProjectDetails({}).$promise;
    }

    getCifsShareDetails.$inject = ['$stateParams', 'SharesService'];
    function getCifsShareDetails($stateParams, SharesService) {
        console.log("called here")
        return SharesService.getCifsShareDetails({}).$promise;
    }
  }());
  