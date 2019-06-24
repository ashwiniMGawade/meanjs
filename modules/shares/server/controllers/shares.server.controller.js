'use strict';

/**
 * Module dependencies
 */
var path = require('path'),
  config = require(path.resolve('./config/config')),
  mongoose = require('mongoose'),
  util = require('util'),
  Share = mongoose.model('Share'),
  User = mongoose.model('User'),
  errorHandler = require(path.resolve('./modules/core/server/controllers/errors.server.controller')),
  userController = require(path.resolve('./modules/users/server/controllers/admin.server.controller')),
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
  share.comment = req.body.comment || '';

  console.log(req.body, share)

  share.save(function (err) {
    if (err) {
      return res.status(422).send({
        message: errorHandler.getErrorMessage(err)
      });
    }

    
    res.json(share);
    mailHandler.sendRequestStatusUpdateMailToUser(share, req.user);

    //execute the wfa workflow if the status changes to approved
    if (share.status == 'Approved') {
      var clientWfa = require('./shares.server.wfa.share.controller');
      sendToWorkflowForExecution(share);
      
    function sendToWorkflowForExecution(share) {
      //set the status to processing      
      saveShareStatus(share, 'Processing');
      var volName = share.bu;

      wfaDB.getClusterInfo(share.city, function(err, details) {
        if (err) {
          console.log("error in getting db details", err);
          saveShareStatus(share, 'Contact Support');
        } else {
          var jobId;
          var args = {
            primarycluster: details.primarycluster,
            primaryvserver: details.primaryvserver,
            secondarycluster:details.secondarycluster,
            secondaryvserver: details.secondaryvserver,
            volumeName:volName,
            shareName: share.projectCode,
            cityAbbr: details.cityAbbr,
            share: share
          };
          console.log("called create share wfa", args);
      
          clientWfa.executeWfaWorkflow(args, function (err, resWfa) {
            if (err) {
              console.log('executeWfaWorkflow : Failed to '+share.category+', Error: ' + err);
              saveShareStatus(share, 'Contact Support');
            } else {
              jobId = resWfa.jobId;
              console.log('executeWfaWorkflow: Response from WFA: ' + util.inspect(resWfa, {showHidden: false, depth: null}));
              untilCreated(share, jobId);
            }
          });
        }
      }) 
     
    }
    
    function untilCreated(share, jobId) {
      var args = {
        share: share,
        jobId: jobId
      };
    
      clientWfa.wfaJobStatus(args, function (err, resWfa) {
        if (err) {
          console.log('wfaJobStatus: Failed to obtain status, Error: ' + err);
          saveShareStatus(share, 'Contact Support');
        } else {
          if (resWfa.jobStatus === 'FAILED') {
            console.log('wfaJobStatus: Failed to '+share.category+', Job ID: ' + jobId);
            saveShareStatus(share, 'Contact Support');
          } else if (resWfa.jobStatus !== 'COMPLETED') {
            console.log('wfaJobStatus: Not completed yet, polling again in 30 seconds, Job ID: ' + jobId);
            setTimeout(function () { untilCreated(share, jobId); }, config.wfa.refreshRate);
          } else {
            saveShareStatus(share, 'Completed'); 
          }
        }
      });
    }

    // function getOutputs(category, jobId) {
    //   var args = {
    //     jobId: jobId,
    //     category: category 
    //   };
  
    //   clientWfa.wfaJobOut(args, function (err, resWfa) {
    //     if (err) {
    //       console.log('wfaJobOut: Failed to obtain output, Error: ' + err);
    //       saveShareStatus(share, 'Contact Support');
    //     } else {
    //       if (resWfa) {            
    //         saveShareStatus(share, 'Completed');                       
    //       } else {
    //         console.log('wfaJobOut: No output parameters: Response from WFA: '+ resWfa);
    //         saveShareStatus(share, 'Contact Support');
    //       }
    //     }
    //   });
    // }
     }
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
  var query = {};

  var searchPhrase = req.query.s;
  var page = req.query.page | 0;
  var perPage = req.query.perPage | 10;
  var getSharesFromQuery = getSharesFromQuery;

  if (req.user.roles.indexOf('admin') === -1) {
    query.user = req.user;
  }

  if(searchPhrase) {
    query['$or'] = [ 
      {
        city: new RegExp( searchPhrase, "i")
      },
      {
        category: new RegExp( searchPhrase, "i")
      },
      {
        status: new RegExp( searchPhrase, "i")
      },
      {
        projectCode: new RegExp( searchPhrase, "i")
      },
      {
        bu: new RegExp( searchPhrase, "i")
      },
      {
        approvers: new RegExp( searchPhrase, "i")
      }
    ];
      // { $or: [ { $text: {$search: searchPhrase} },
      //  ]
      // }
    userController.userByDisplayname(searchPhrase, function(err, users) {
      if (err) {
        return res.status(422).send({
          message: errorHandler.getErrorMessage(err)
        });
      } else if (users.length > 0) {
        var userIds = users.map(function( user ) {
            return user._id;
        });
        query['$or'].push( 
          {
            user: {"$in": userIds}
          },
        )
      }
      return getSharesFromQuery(query);
    });
    
  } else {
    return getSharesFromQuery(query);
  }
   //query.setOptions({explain: 'executionStats'});
  // .sort( {
  //   score: { $meta : 'textScore' }
  // } )
  //queryExec.explain().then(console.log);

  //Share.find(query).sort('-created').populate('user', 'displayName').
 
  function getSharesFromQuery(query) {
    Share.count(query, function (err, count) {
      console.log(query, err, "after query formation")
      if (err) {
        return res.status(422).send({
          message: errorHandler.getErrorMessage(err)
        });
      }
      if (count > 0) {
        Share.find(query).skip(page*perPage).limit(perPage).sort('-created').populate('user', 'displayName').exec(function (err, shares) {
          if (err) {
            return res.status(422).send({
              message: errorHandler.getErrorMessage(err)
            });
          }
          res.json({'shares': shares, total: count});
        });
      } else {
        res.json({'shares': [], total:count});
      }
  
    });
  }
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
        mailHandler.sendMailForApproval(share, req.user);        
      }
    });  
  };


  var saveShareStatus = function(share, status) {
    share.status = status;
    share.save(function (err) {
      if (err) {
       console.log("error in saving the status", err)
      }
    });
  }

/**
 * Share middleware
 */
exports.shareByID = function (req, res, next, id) {
  if (!mongoose.Types.ObjectId.isValid(id)) {
    return res.status(400).send({
      message: 'Share is invalid'
    });
  }

  Share.findById(id).populate('user', ['displayName', 'email']).exec(function (err, share) {
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
  wfaDB.getCifsShare(req.query.location.toLowerCase(), req.query.volname, req.query.sharename, function(err, details) {
    if (err) {
      res.json({});
    } else {
      console.log(details)
      res.json(details);
    }
  }) 
}

exports.getCifsShareACLGroups = function(req, res) {
  wfaDB.getCifsShareACLGroups(req.query.sharename.toLowerCase(), function(err, details) {
    if (err) {
      res.json({});
    } else {
      console.log(details)
      res.json(details);
    }
  }) 
}
