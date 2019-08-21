(function () {
  'use strict';

  // Users service used for communicating with the users REST endpoint
  angular
    .module('users.services')
    .factory('UsersService', UsersService);

  UsersService.$inject = ['$resource'];

  function UsersService($resource) {
    var Users = $resource('/storage/api/users', {}, {
      update: {
        method: 'PUT'
      },
      updatePassword: {
        method: 'POST',
        url: '/storage/api/users/password'
      },
      deleteProvider: {
        method: 'DELETE',
        url: '/storage/api/users/accounts',
        params: {
          provider: '@provider'
        }
      },
      sendPasswordResetToken: {
        method: 'POST',
        url: '/storage/api/auth/forgot'
      },
      resetPasswordWithToken: {
        method: 'POST',
        url: '/storage/api/auth/reset/:token'
      },
      signup: {
        method: 'POST',
        url: '/storage/api/auth/signup'
      },
      signin: {
        method: 'POST',
        url: '/storage/api/auth/signin'
      },
      getUserProjectDetails: {
        method: 'GET',
        url: '/storage/api/users/projectInfo'
      },
      getUsers: {
        method: 'GET',
        url: '/storage/api/users/list',
        isArray: true
      },
  	  getUsersAndGroups: {
          method: 'GET',
          url: '/storage/api/users/usersAndGroupsList',
          isArray: true
      },
      getACLGroupUsers: {
          method: 'GET',
          url: '/storage/api/users/ACLUserList',
          isArray: true
        }
    });

    angular.extend(Users, {
      changePassword: function (passwordDetails) {
        return this.updatePassword(passwordDetails).$promise;
      },
      removeSocialAccount: function (provider) {
        return this.deleteProvider({
          provider: provider // api expects provider as a querystring parameter
        }).$promise;
      },
      requestPasswordReset: function (credentials) {
        return this.sendPasswordResetToken(credentials).$promise;
      },
      resetPassword: function (token, passwordDetails) {
        return this.resetPasswordWithToken({
          token: token // api expects token as a parameter (i.e. /:token)
        }, passwordDetails).$promise;
      },
      userSignup: function (credentials) {
        return this.signup(credentials).$promise;
      },
      userSignin: function (credentials) {
        return this.signin(credentials).$promise;
      }
    });

    return Users;
  }

  // TODO this should be Users service
  angular
    .module('users.admin.services')
    .factory('AdminService', AdminService);

  AdminService.$inject = ['$resource'];

  function AdminService($resource) {
    return $resource('/storage/api/users/:userId', {
      userId: '@_id'
    }, {
      update: {
        method: 'PUT'
      }
    });
  }
}());
