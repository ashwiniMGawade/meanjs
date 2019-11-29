'use strict';

/**
 * Module dependencies
 */
var settingsPolicy = require('../policies/settings.server.policy'),
  settings = require('../controllers/settings.server.controller');

module.exports = function (app) {
  // shares collection routes
  app.route('/storage/api/settings').all(settingsPolicy.isAllowed)
  .get(settings.Settingslist);

  // Single share routes
  app.route('/storage/api/settings/:settingId').all(settingsPolicy.isAllowed)
    .put(settings.update);

  
  
  // Finish by binding the share middleware
 app.param('settingId', settings.settingByID);
};
