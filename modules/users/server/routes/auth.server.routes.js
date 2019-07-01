'use strict';

/**
 * Module dependencies
 */
var passport = require('passport');

module.exports = function (app) {
  // User Routes
  var users = require('../controllers/users.server.controller');

  app.use(users.signin);

  // Setting up the users password api
  app.route('/meanjs/api/auth/forgot').post(users.forgot);
  app.route('/meanjs/api/auth/reset/:token').get(users.validateResetToken);
  app.route('/meanjs/api/auth/reset/:token').post(users.reset);

  // Setting up the users authentication api
  app.route('/meanjs/api/auth/signup').post(users.signup);
  app.route('/meanjs/api/auth/signin').post(users.signin);
  app.route('/meanjs/api/auth/signout').get(users.signout);

  // Setting the oauth routes
  app.route('/meanjs/api/auth/:strategy').get(users.oauthCall);
  app.route('/meanjs/api/auth/:strategy/callback').get(users.oauthCallback);

};
