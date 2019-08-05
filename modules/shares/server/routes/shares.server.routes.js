'use strict';

/**
 * Module dependencies
 */
var sharesPolicy = require('../policies/shares.server.policy'),
  shares = require('../controllers/shares.server.controller');

module.exports = function (app) {
  // shares collection routes
  app.route('/storage/api/shares').all(sharesPolicy.isAllowed)
    .get(shares.list)
    .post(shares.create);

  app.route('/storage/api/shares/getCifsShareDetails')
    .get(shares.getCifsShareDetails)

  app.route('/storage/api/shares/getCifsShareACLGroups')
    .get(shares.getCifsShareACLGroups)

  app.route('/storage/api/shares/listStatus')
    .get(shares.listStatus)
    

  // Single share routes
  app.route('/storage/api/shares/:shareId').all(sharesPolicy.isAllowed)
    .get(shares.read)
    .put(shares.update)
    .delete(shares.delete);

  // Single share routes
  app.route('/storage/api/shares/:shareId/:action').all(sharesPolicy.isAllowed)
    .put(shares.updateRequest);

  
  // Finish by binding the share middleware
  app.param('shareId', shares.shareByID);
};
