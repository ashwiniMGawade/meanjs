'use strict';

/**
 * Module dependencies
 */
var path = require('path'),
  mongoose = require('mongoose'),
  Share = mongoose.model('Share'),
  errorHandler = require(path.resolve('./modules/core/server/controllers/errors.server.controller')),
  wfaDB = require(path.resolve('./modules/shares/server/controllers/shares.server.wfa.db.read')),
  mailHandler = require(path.resolve('./modules/shares/server/controllers/shares.server.mailHandler'));

/**
 * Show the current share
 */
exports.read = function (req, res) {
  res.json(req.model);
};

/**
 * Update a share
 */
exports.update = function (req, res) {
  var share = req.model;

  // For security purposes only merge these parameters
//   user.firstName = req.body.firstName;
//   user.lastName = req.body.lastName;
//   user.displayName = user.firstName + ' ' + user.lastName;
//   user.roles = req.body.roles;

  share.save(function (err) {
    if (err) {
      return res.status(422).send({
        message: errorHandler.getErrorMessage(err)
      });
    }

    res.json(share);
  });
};


/**
 * Update a share
 */
exports.updateRequest = function (req, res) {
  var share = req.model;

  share.status = req.params.action == 'approve' ? 'Approved' : 'Rejected';

  share.save(function (err) {
    if (err) {
      return res.status(422).send({
        message: errorHandler.getErrorMessage(err)
      });
    }

    res.json(share);
  });
};

/**
 * Delete a share
 */
exports.delete = function (req, res) {
  var share = req.model;

  share.remove(function (err) {
    if (err) {
      return res.status(422).send({
        message: errorHandler.getErrorMessage(err)
      });
    }

    res.json(share);
  });
};

/**
 * List of Shares
 */
exports.list = function (req, res) {
  Share.find({}).sort('-created').populate('user', 'displayName').exec(function (err, shares) {
    if (err) {
      return res.status(422).send({
        message: errorHandler.getErrorMessage(err)
      });
    }

    res.json(shares);
  });
};

/**
 * Create an share
 */
exports.create = function (req, res) {
    var share = new Share(req.body);
    share.user = req.user;
  
    share.save(function (err) {
      if (err) {
        return res.status(422).send({
          message: errorHandler.getErrorMessage(err)
        });
      } else {
        res.json(share);
        mailHandler.sendMailForApproval(share)
      }
    });
  };

/**
 * Share middleware
 */
exports.shareByID = function (req, res, next, id) {
  if (!mongoose.Types.ObjectId.isValid(id)) {
    return res.status(400).send({
      message: 'Share is invalid'
    });
  }

  Share.findById(id).populate('user', 'displayName').exec(function (err, share) {
    if (err) {
      return next(err);
    } else if (!share) {
      return next(new Error('Failed to load user ' + id));
    }

    req.model = share;
    next();
  });
};

exports.getCifsShareDetails = function (req, res) {
  wfaDB.getCifsShare(req.user.providerData.city, req.user.providerData.projectCode.substring(0,3), function(err, details) {
    if (err) {
      res.json({});
    } else {
      res.json(details);
    }
  }) 
}
