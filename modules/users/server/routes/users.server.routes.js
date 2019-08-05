'use strict';

module.exports = function (app) {
  // User Routes
  var users = require('../controllers/users.server.controller');

  // Setting up the users profile api
  app.route('/storage/api/users/me').get(users.me);
  app.route('/storage/api/users').put(users.update);
  app.route('/storage/api/users/accounts').delete(users.removeOAuthProvider);
  app.route('/storage/api/users/password').post(users.changePassword);
  app.route('/storage/api/users/picture').post(users.changeProfilePicture);

  app.route('/storage/api/users/projectInfo').get(users.projectInfo);
  app.route('/storage/api/users/list').get(users.getUsers);

  app.route('/storage/api/users/usersAndGroupsList').get(users.getUsersAndGroups);
  // Finish by binding the user middleware
  app.param('userId', users.userByID);
};
