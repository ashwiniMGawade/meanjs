'use strict';

/**
 * Module dependencies
 */
var path = require('path'),
  config = require(path.resolve('./config/config')),
  mongoose = require('mongoose'),
  util = require('util'),
  path = require('path'),
  logger = require(path.resolve('./config/lib/log')),
  Share = mongoose.model('Share'),
  User = mongoose.model('User'),
  fs = require('fs'),
  errorHandler = require(path.resolve('./modules/core/server/controllers/errors.server.controller')),
  userController = require(path.resolve('./modules/users/server/controllers/admin.server.controller')),
  wfaDB = require(path.resolve('./modules/shares/server/controllers/shares.server.wfa.db.read')),
  mailHandler = require(path.resolve('./modules/shares/server/controllers/shares.server.mailHandler'));
  // var multiparty = require('multiparty');

   logger.info("share module");

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
  console.log(share)
  share.status = req.body.status;

  share.save(function (err) {
    if (err) {
      logger.info(': Failed to save share object: ' + err);
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
  logger.info("update request called")

  share.status = req.params.action == 'approve' ? 'Approved' : (req.params.action == 'fix' ? req.body.status :'Rejected');
  share.comment = req.body.comment || '';
  share.volumeName = req.body.volumeName || '';

  logger.info("updating request for action = "+req.params.action  +" share status="+ share.status);
    share.save(function (err, shareData) {
      if (err) {
      console.log("error in saving the status", err)
      } 
      logger.info("changed the share status="+ shareData.status);    
      res.json(shareData);
    });
  
    mailHandler.sendRequestStatusUpdateMailToUser(share, req.user);


    //execute the wfa workflow if the status changes to approved
    if (share.status == 'Approved') {     
      sendToWorkflowForExecution(share, req.user);    
    }
};

function sendToWorkflowForExecution(share, user) {
  //set the status to processing      
  var clientWfa = require('./shares.server.wfa.share.controller');
  saveShareStatus(share, 'Processing', user);
  var volName = share.volumeName!= '' ? share.volumeName : share.bu;

  wfaDB.getClusterInfo(share.city, function(err, details) {
    if (err) {
      console.log("error in getting db details", err);
      saveShareStatus(share, 'Contact Support', user, "error in getting db details" + err);
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
          saveShareStatus(share, 'Contact Support', user, 'executeWfaWorkflow : Failed to '+share.category+', Error: ' + err);
        } else {
          jobId = resWfa.jobId;
          console.log('executeWfaWorkflow: Response from WFA: ' + util.inspect(resWfa, {showHidden: false, depth: null}));
          untilCreated(share, jobId, user);
        }
      });
    }
  }) 

}

function untilCreated(share, jobId, user) {
  var clientWfa = require('./shares.server.wfa.share.controller');
  var args = {
    share: share,
    jobId: jobId
  };

  clientWfa.wfaJobStatus(args, function (err, resWfa) {
    if (err) {
      console.log('wfaJobStatus: Failed to obtain status, Error: ' + err);
      saveShareStatus(share, 'Contact Support', user, 'wfaJobStatus: Failed to obtain status, Error: ' + err);
    } else {
      if (resWfa.jobStatus === 'FAILED') {
        console.log('wfaJobStatus: Failed to '+share.category+', Job ID: ' + jobId);
        saveShareStatus(share, 'Contact Support', user, 'wfaJobStatus: Failed to '+share.category+', Job ID: ' + jobId + ", errorMessage = "+resWfa.errorMessage);
      } else if (resWfa.jobStatus !== 'COMPLETED') {
        console.log('wfaJobStatus: Not completed yet, polling again in 30 seconds, Job ID: ' + jobId);
        setTimeout(function () { untilCreated(share, jobId, user); }, config.wfa.refreshRate);
      } else {
        saveShareStatus(share, 'Completed', user); 
      }
    }
  });
}
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

  logger.info("list called");
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

 
  function getSharesFromQuery(query) {
    Share.count(query, function (err, count) {
      console.log(query, err, "after query formation")
      if (err) {
        return res.status(422).send({
          message: errorHandler.getErrorMessage(err)
        });
      }
      logger.info("count=>"+ count);
      if (count > 0) {
        var queryex = Share.find(query).skip(page*perPage).limit(perPage).sort('-created').populate('user', 'displayName').exec(function (err, sharesData) {
          // logger.info( util.inspect(queryex, {showHidden: false, depth: null}));
          if (err) {
            return res.status(422).send({
              message: errorHandler.getErrorMessage(err)
            });
          }
          res.json({'shares': sharesData, total: count});
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
    var autoApprove = false;
    if (req.body.IsLoggedInUserInCC) {
      autoApprove = true;
      delete req.body.IsLoggedInUserInCC;
    }
   
    var share = new Share(req.body);    
    share.user = req.user;  
    if(autoApprove) {
      share.status = "Approved";     
    }
    share.save(function (err) {
      if (err) {
        return res.status(422).send({
          message: errorHandler.getErrorMessage(err)
        });
      } else {
        res.json(share);
        if (autoApprove) {
          sendToWorkflowForExecution(share, req.user);
        } else {
          mailHandler.sendMailForApproval(share, req.user);        
        }       
      }
    });  
  };


var saveShareStatus = function(share, status, user, err=null) {
  share.status = status;
  if (status == "Contact Support") {
    share.error = err
  }
  share.save(function (err) {
    if (err) {
      console.log("error in saving the status", err)
    } else {
      console.log("saving share status to "+ share.status);
      logger.info("saving share status to "+ share.status);
      //setTimeout(function() {console.log("added delay for test")}, 10000)
        mailHandler.sendRequestStatusUpdateMailToUser(share, user);
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
      res.json([]);
    } else {
      console.log(details)
      res.json(details);
    }
  }) 
}

exports.listStatus = function (req, res) {
  res.json(Share.schema.path('status').enumValues);
};

exports.getNewShareProcessingDetails = function(req, res) {
  var query = {};
  var city = req.query.location ? req.query.location.toUpperCase() : '';
  var bu = req.query.bu || '';
  var projectCode = req.query.projectCode || '';

  if (city != '') {
    query.city = city;
  }
  if (bu != '') {
    query.bu = bu;
  }
  if (projectCode != '') {
    query.projectCode = projectCode;
  }
  query.category = "newShare";
  query.status = {$in: ['Processing', 'Completed']}

  
  var queryExec = Share.aggregate([
    {$match: query},
    {
      $project: {
          _id: 1, // let's remove bson id's from request's result
          status: 1, // we need this field
      }
  },
  {
      $group: {
          _id: '$status',
          count: { $sum: 1 }
      }
  }]).exec(function (err, sharedata) {
    console.log("sharedata", sharedata)
   console.log( util.inspect(queryExec, {showHidden: false, depth: null}));
    if (err) {
      return  res.json();
    } else if (!sharedata) {
      return  res.json();
    } else {
      return res.json(sharedata);
    }
   
  });
}


// exports.parseAndProcessMails = function(req, res) {
//   const EWS = require('node-ews');
 
//   // exchange server connection info
//   const ewsConfig = {
//     username: 'myuser@domain.com',
//     password: 'mypassword',
//     host: 'https://ews.domain.com'
//   };
  
//   // initialize node-ews
//   const ews = new EWS(ewsConfig);
  
//   // define ews api function
//   const ewsFunction = 'ExpandDL';
  
//   // define ews api function args
//   const ewsArgs = {
//     'Mailbox': {
//       'EmailAddress':'publiclist@domain.com'
//     }
//   };
  
//   // query EWS and print resulting JSON to console
//   ews.run(ewsFunction, ewsArgs)
//     .then(result => {
//       console.log(JSON.stringify(result));
//     })
//     .catch(err => {
//       console.log(err.message);
//     });
// }

//create new subscription

exports.parseAndProcessMails = function() {
  const EWS = require('node-ews');
 
  // exchange server connection info
  const ewsConfig1 = {
    username: config.ews.user,
    password: config.ews.password,
    host: config.ews.host
  };
  
  // initialize node-ews
  const ews = new EWS(ewsConfig1);
  var jsonPath = path.join(__dirname, '..', 'NotificationService.wsdl');
  

  // specify listener service options
  const serviceOptions = {
    port: 3001, // defaults to port 8000
    path: '/', // defaults to '/notification'
    // If you do not have NotificationService.wsdl it can be found via a quick Google search
    xml:fs.readFileSync(jsonPath, 'utf8') // the xml field is required
  };

  // create the listener service
  ews.notificationService(serviceOptions, function(response) {
    console.log(new Date().toISOString(), '| Received EWS Push Notification');
    console.log(new Date().toISOString(), '| Response:', JSON.stringify(response));
    // Do something with response
    return {SendNotificationResult: { SubscriptionStatus: 'OK' } }; // respond with 'OK' to keep subscription alive
    // return {SendNotificationResult: { SubscriptionStatus: 'UNSUBSCRIBE' } }; // respond with 'UNSUBSCRIBE' to unsubscribe
  })
  .then(server => {
    server.log = function(type, data) {
      console.log(new Date().toISOString(), '| ', type, ':', data);
    };
  });

  // create a push notification subscription
// https://msdn.microsoft.com/en-us/library/office/aa566188
  const ewsConfig = {
  PushSubscriptionRequest: {
    FolderIds: {
      DistinguishedFolderId: {
        attributes: {
          Id: 'inbox'
        }
      }
    },
    EventTypes: {
      EventType: ['NewMailEvent']
    },
    StatusFrequency: 1,
    // subscription notifications will be sent to our listener service
    URL: 'http://' + require('os').hostname() + ':' + serviceOptions.port + serviceOptions.path
  }
  };
  ews.run('Subscribe', ewsConfig);

}