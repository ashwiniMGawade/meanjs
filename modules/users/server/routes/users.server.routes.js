'use strict';

module.exports = function (app) {
  // User Routes
  var users = require('../controllers/users.server.controller');

  // Setting up the users profile api
  app.route('/meanjs/api/users/me').get(users.me);
  app.route('/meanjs/api/users').put(users.update);
  app.route('/meanjs/api/users/accounts').delete(users.removeOAuthProvider);
  app.route('/meanjs/api/users/password').post(users.changePassword);
  app.route('/meanjs/api/users/picture').post(users.changeProfilePicture);

  app.route('/meanjs/api/users/projectInfo').get(users.projectInfo);
  app.route('/meanjs/api/users/list').get(users.getUsers);

  // Finish by binding the user middleware
  app.param('userId', users.userByID);
};
