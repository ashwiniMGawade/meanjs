'use strict';

/**
 * Module dependencies
 */
var acl = require('acl');

// Using the memory backend
acl = new acl(new acl.memoryBackend());

/**
 * Invoke Shares Permissions
 */
exports.invokeRolesPolicies = function () {
  acl.allow([{
    roles: ['admin'],
    allows: [{
      resources: '/storage/api/shares',
      permissions: '*'
    }, {
      resources: '/storage/api/shares/:shareId',
      permissions: '*'
    },
    {
      resources: '/storage/api/shares/:shareId/:action',
      permissions: '*'
    },
    {
      resources: '/storage/api/shares/getCifsShareDetails',
      permissions: '*'
    },
    {
      resources: '/storage/api/shares/getNewShareProcessingDetails',
      permissions: '*'
    },
    {
      resources: '/storage/api/shares/getCifsShareACLGroups',
      permissions: '*'
    },
     {
      resources: '/storage/api/shares/listStatus',
      permissions: '*'
    },
    {
      resources: '/storage/api/shares/listVolumes',
      permissions: '*'
    }
  ]
  }, {
    roles: ['user'],
    allows: [{
      resources: '/storage/api/shares',
      permissions: '*'
    }, {
      resources: '/storage/api/shares/:shareId',
      permissions: '*'
    },
     {
      resources: '/storage/api/shares/getCifsShareDetails',
      permissions: '*'
    },
    {
      resources: '/storage/api/shares/getNewShareProcessingDetails',
      permissions: '*'
    },
    {
      resources: '/storage/api/shares/getCifsShareACLGroups',
      permissions: '*'
    },
     {
      resources: '/storage/api/shares/listStatus',
      permissions: '*'
    }]
  }]);
};

/**
 * Check If Shares Policy Allows
 */
exports.isAllowed = function (req, res, next) {
  var roles = (req.user) ? req.user.roles : ['guest'];

  // If an article is being processed and the current user created it then allow any manipulation
  if (req.share && req.user && req.share.user && req.share.user.id === req.user.id) {
    return next();
  }

  // Check for user roles
  acl.areAnyRolesAllowed(roles, req.route.path, req.method.toLowerCase(), function (err, isAllowed) {
    if (err) {
      // An authorization error occurred
      return res.status(500).send('Unexpected authorization error');
    } else {
      if (isAllowed) {
        // Access granted! Invoke next middleware
        return next();
      } else {
        return res.status(403).json({
          message: 'User is not authorized'
        });
      }
    }
  });
};
