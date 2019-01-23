'use strict';

/**
 * Module dependencies
 */
var sharesPolicy = require('../policies/shares.server.policy'),
  shares = require('../controllers/shares.server.controller');

module.exports = function (app) {
  // shares collection routes
  app.route('/api/shares').all(sharesPolicy.isAllowed)
    .get(shares.list)
    .post(shares.create);

  // Single share routes
  app.route('/api/shares/:shareId').all(sharesPolicy.isAllowed)
    .get(shares.read)
    .put(shares.update)
    .delete(shares.delete);

  // Finish by binding the share middleware
  app.param('shareId', shares.shareByID);
};
