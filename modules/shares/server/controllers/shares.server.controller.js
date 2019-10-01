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

  // For security purposes only merge these parameters
//   user.firstName = req.body.firstName;
//   user.lastName = req.body.lastName;
//   user.displayName = user.firstName + ' ' + user.lastName;
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
      var clientWfa = require('./shares.server.wfa.share.controller');
      sendToWorkflowForExecution(share);
      
    function sendToWorkflowForExecution(share) {
      //set the status to processing      
      saveShareStatus(share, 'Processing', req.user);
      var volName = share.bu;

      wfaDB.getClusterInfo(share.city, function(err, details) {
        if (err) {
          console.log("error in getting db details", err);
          saveShareStatus(share, 'Contact Support', req.user, "error in getting db details" + err);
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
              saveShareStatus(share, 'Contact Support', req.user, 'executeWfaWorkflow : Failed to '+share.category+', Error: ' + err);
            } else {
              jobId = resWfa.jobId;
              console.log('executeWfaWorkflow: Response from WFA: ' + util.inspect(resWfa, {showHidden: false, depth: null}));
              untilCreated(share, jobId, req.user);
            }
          });
        }
      }) 
     
    }
    
    function untilCreated(share, jobId, user) {
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
      logger.info("count=>"+ count);
      if (count > 0) {
        var queryex = Share.find(query).skip(page*perPage).limit(perPage).sort('-created').populate('user', 'displayName').exec(function (err, sharesData) {
          logger.info( util.inspect(queryex, {showHidden: false, depth: null}));
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


// exports.parseMail = function(req, res) {
//   console.log('Receiving webhook.');

//   /* Respond early to avoid timouting the mailin server. */
//   // res.send(200);

//   /* Parse the multipart form. The attachments are parsed into fields and can
//    * be huge, so set the maxFieldsSize accordingly. */
//   var form = new multiparty.Form({
//       maxFieldsSize: 70000000
//   });

//   form.on('progress', function () {
//       var start = Date.now();
//       var lastDisplayedPercentage = -1;
//       return function (bytesReceived, bytesExpected) {
//           var elapsed = Date.now() - start;
//           var percentage = Math.floor(bytesReceived / bytesExpected * 100);
//           if (percentage % 20 === 0 && percentage !== lastDisplayedPercentage) {
//               lastDisplayedPercentage = percentage;
//               console.log('Form upload progress ' +
//                   percentage + '% of ' + bytesExpected / 1000000 + 'Mb. ' + elapsed + 'ms');
//           }
//       };
//   }());

//   form.parse(req, function (err, fields) {
//       console.log(util.inspect(fields.mailinMsg, {
//           depth: 5
//       }));

//       console.log('Parsed fields: ' + Object.keys(fields));

//       /* Write down the payload for ulterior inspection. */
//       async.auto({
//           writeParsedMessage: function (cbAuto) {
//               fs.writeFile('payload.json', fields.mailinMsg, cbAuto);
//           },
//           writeAttachments: function (cbAuto) {
//               var msg = JSON.parse(fields.mailinMsg);
//               async.eachLimit(msg.attachments, 3, function (attachment, cbEach) {
//                   fs.writeFile(attachment.generatedFileName, fields[attachment.generatedFileName], 'base64', cbEach);
//               }, cbAuto);
//           }
//       }, function (err) {
//           if (err) {
//               console.log(err.stack);
//               res.send(500, 'Unable to write payload');
//           } else {
//               console.log('Webhook payload written.');
//               res.send(200);
//           }
//       });
//   });
// }