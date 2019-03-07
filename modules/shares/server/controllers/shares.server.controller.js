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
    mailHandler.sendRequestStatusUpdateMailToUser(share, req.user);

    //execute the wfa workflow if the status changes to approved
    if (share.status == 'Approved') {
      var clientWfa = require('./shares.server.wfa.share.controller');
      sendToWorkflowForExecution(share);
      
    function sendToWorkflowForExecution(share) {
      //set the status to processing
      saveShareStatus(share, 'Processing');
      var volName = req.user.providerData.projectCode.substring(0,4);

      wfaDB.getClusterInfo(req.user.providerData.city, volName, function(err, details) {
        if (err) {
          console.log("error in getting db details", err);
          saveShareStatus(share, 'Contact Support');
        } else {
          var jobId;
          var args = {
            clusterName: details.clustername,
            vserverName: details.vservername,
            volumeName:volName,
            shareName: req.user.providerData.projectCode,
            share: share
          };
          console.log("called create share wfa");
      
          clientWfa.executeWfaWorkflow(args, function (err, resWfa) {
            if (err) {
              console.log('executeWfaWorkflow : Failed to '+share.category+', Error: ' + err);
              saveShareStatus(share, 'Contact Support');
            } else {
              jobId = resWfa.jobId;
              console.log('executeWfaWorkflow: Response from WFA: ' + util.inspect(resWfa, {showHidden: false, depth: null}));
              untilCreated(jobId);
            }
          });
        }
      }) 
     
    }
    
    function untilCreated(jobId) {
      var args = {
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
            setTimeout(function () { untilCreated(jobId); }, config.wfa.refreshRate);
          } else {
            getOutputs(jobId);
          }
        }
      });
    }

    function getOutputs(jobId) {
      var args = {
        jobId: jobId
      };
  
      clientWfa.wfaJobOut(args, function (err, resWfa) {
        if (err) {
          console.log('wfaJobOut: Failed to obtain output, Error: ' + err);
          saveShareStatus(share, 'Contact Support');
        } else {
          if (resWfa) {            
            saveShareStatus(share, 'Operational');                       
          } else {
            console.log('wfaJobOut: No output parameters: Response from WFA: '+ resWfa);
            saveShareStatus(share, 'Contact Support');
          }
        }
      });
    }
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
  wfaDB.getCifsShare(req.user.providerData.city, req.user.providerData.projectCode.substring(0,3), function(err, details) {
    if (err) {
      res.json({});
    } else {
      res.json(details);
    }
  }) 
}
