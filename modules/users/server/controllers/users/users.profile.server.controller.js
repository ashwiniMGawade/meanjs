'use strict';

const NodeCache = require( "node-cache" );
const myCache = new NodeCache( { stdTTL: 1440, checkperiod: 720 } );

/**
 * Module dependencies
 */
var _ = require('lodash'),
  fs = require('fs'),
  path = require('path'),
  errorHandler = require(path.resolve('./modules/core/server/controllers/errors.server.controller')),
  util = require('util'),
  logger = require(path.resolve('./config/lib/log')),
  mongoose = require('mongoose'),
  multer = require('multer'),
  multerS3 = require('multer-s3'),
  aws = require('aws-sdk'),
  amazonS3URI = require('amazon-s3-uri'),
  config = require(path.resolve('./config/config')),
  User = mongoose.model('User'),
  sql = require(path.resolve('./config/lib/sql')),
  Request = require('tedious').Request,
  validator = require('validator');

var whitelistedFields = ['firstName', 'lastName', 'email', 'username'];

var useS3Storage = config.uploads.storage === 's3' && config.aws.s3;
var s3;

if (useS3Storage) {
  aws.config.update({
    accessKeyId: config.aws.s3.accessKeyId,
    secretAccessKey: config.aws.s3.secretAccessKey
  });

  s3 = new aws.S3();
}

/**
 * Update user details
 */
exports.update = function (req, res) {
  // Init Variables
  var user = req.user;

  if (user) {
    // Update whitelisted fields only
    user = _.extend(user, _.pick(req.body, whitelistedFields));

    user.updated = Date.now();
    user.displayName = user.firstName + ' ' + user.lastName;

    user.save(function (err) {
      if (err) {
        return res.status(422).send({
          message: errorHandler.getErrorMessage(err)
        });
      } else {
        req.login(user, function (err) {
          if (err) {
            res.status(400).send(err);
          } else {
            res.json(user);
          }
        });
      }
    });
  } else {
    res.status(401).send({
      message: 'User is not signed in'
    });
  }
};

/**
 * Update profile picture
 */
exports.changeProfilePicture = function (req, res) {
  var user = req.user;
  var existingImageUrl;
  var multerConfig;


  if (useS3Storage) {
    multerConfig = {
      storage: multerS3({
        s3: s3,
        bucket: config.aws.s3.bucket,
        acl: 'public-read'
      })
    };
  } else {
    multerConfig = config.uploads.profile.image;
  }

  // Filtering to upload only images
  multerConfig.fileFilter = require(path.resolve('./config/lib/multer')).imageFileFilter;

  var upload = multer(multerConfig).single('newProfilePicture');

  if (user) {
    existingImageUrl = user.profileImageURL;
    uploadImage()
      .then(updateUser)
      .then(deleteOldImage)
      .then(login)
      .then(function () {
        res.json(user);
      })
      .catch(function (err) {
        res.status(422).send(err);
      });
  } else {
    res.status(401).send({
      message: 'User is not signed in'
    });
  }

  function uploadImage() {
    return new Promise(function (resolve, reject) {
      upload(req, res, function (uploadError) {
        if (uploadError) {
          reject(errorHandler.getErrorMessage(uploadError));
        } else {
          resolve();
        }
      });
    });
  }

  function updateUser() {
    return new Promise(function (resolve, reject) {
      user.profileImageURL = config.uploads.storage === 's3' && config.aws.s3 ?
        req.file.location :
        '/' + req.file.path;
      user.save(function (err, theuser) {
        if (err) {
          reject(err);
        } else {
          resolve();
        }
      });
    });
  }

  function deleteOldImage() {
    return new Promise(function (resolve, reject) {
      if (existingImageUrl !== User.schema.path('profileImageURL').defaultValue) {
        if (useS3Storage) {
          try {
            var { region, bucket, key } = amazonS3URI(existingImageUrl);
            var params = {
              Bucket: config.aws.s3.bucket,
              Key: key
            };

            s3.deleteObject(params, function (err) {
              if (err) {
                console.log('Error occurred while deleting old profile picture.');
                console.log('Check if you have sufficient permissions : ' + err);
              }

              resolve();
            });
          } catch (err) {
            console.warn(`${existingImageUrl} is not a valid S3 uri`);

            return resolve();
          }
        } else {
          fs.unlink(path.resolve('.' + existingImageUrl), function (unlinkError) {
            if (unlinkError) {

              // If file didn't exist, no need to reject promise
              if (unlinkError.code === 'ENOENT') {
                console.log('Removing profile image failed because file did not exist.');
                return resolve();
              }

              console.error(unlinkError);

              reject({
                message: 'Error occurred while deleting old profile picture'
              });
            } else {
              resolve();
            }
          });
        }
      } else {
        resolve();
      }
    });
  }

  function login() {
    return new Promise(function (resolve, reject) {
      req.login(user, function (err) {
        if (err) {
          res.status(400).send(err);
        } else {
          resolve();
        }
      });
    });
  }
};

/**
 * Send User
 */
exports.me = function (req, res) {
  // Sanitize the user - short term solution. Copied from core.server.controller.js
  // TODO create proper passport mock: See https://gist.github.com/mweibel/5219403
  var safeUserObject = null;
  if (req.user) {
    safeUserObject = {
      displayName: validator.escape(req.user.displayName),
      provider: validator.escape(req.user.provider),
      username: validator.escape(req.user.username),
      created: req.user.created.toString(),
      roles: req.user.roles,
      profileImageURL: req.user.profileImageURL,
      email: validator.escape(req.user.email),
      lastName: validator.escape(req.user.lastName),
      firstName: validator.escape(req.user.firstName),
      additionalProvidersData: req.user.additionalProvidersData
    };
  }

  res.json(safeUserObject || null);
};

exports.projectInfo = function(req, res) {
  
  var request = new Request("Select txtibucode,dm,pm,startDate,endDate,projectcode from V_AHD_ProjectDetails where projectcode ='" + req.user.providerData.projectCode + "';", function (err, rowCount, rows) {

    if (err) {
        console.log(err);
    } else {
        console.log(rowCount + ' rows');
    }
    console.log(rows) // this is the full array of row objects
    // it just needs some manipulating

    var jsonArray  = []
    rows.forEach(function (columns) {
        var rowObject ={};
        columns.forEach(function(column) {
            rowObject[column.metadata.colName] = column.value;
        });
        rowObject["city"] = req.user.providerData.city
        jsonArray.push(rowObject)
    });

    res.json(jsonArray[0]);
  });

  sql.getConnction(function(conn) {
    conn.execSql(request);
  });
  

 //  res.json({ txtibucode: 'MDT' ,//'MFGADM', //NFSShare
 //  dm: 'subhankar           ',
 //  pm: 'Kaustav_Bhowmik     ',
 //  startDate: "2012-09-10T00:00:00.000Z",
 //  endDate: "2014-12-31T00:00:00.000Z",
 //  city: "BANGALORE",
 //  projectcode: "MDT2018"
 // });
}

exports.getUsers = function(req, res) {
  var ActiveDirectory = require('activedirectory');
  console.log(config.ldap)
  
  var ADconfig = { 
    url: config.ldap.url,
    bindDN: config.ldap.bindDN, 
    bindCredentials: config.ldap.bindCredentials, 
    baseDN: config.ldap.searchBase
 }

  var ad = new ActiveDirectory(ADconfig);

  var search = req.query.search || 'a';

  var opts = {
    filter: '(&(objectClass=user)(sAMAccountName=*'+search+'*))', //'(&(objectCategory=Person)(sAMAccountName=*))' (!userAccountControl:1.2.840.113556.1.4.803:=2)
    attributes: [ 'sAMAccountName', 'userPrinicipalName', 'displayName' ],
    sizeLimit : 0
  };

  myCache.get("ADUsers?search="+search, function( err, value ){
  if( !err ){
    if(value == undefined){
      // key not found
      ad.findUsers(opts, function(err, users) {
        if (err) {      
          logger.info('ERROR: ' +JSON.stringify(err));
          res.status(400).send(err);
        } else {
          if ((! users) || (users.length == 0)) {
            logger.info('No users found.');
            res.json({});
          }
          else {
            logger.info('findUsers: '+JSON.stringify(users));
            var keyArray = users.map(function(item) { 
              return { 
              'sAMAccountName' : item["sAMAccountName"],
              'displayName' : item["displayName"],
              }
            });
            myCache.set( "ADUsers?search="+search, keyArray, 10000 );  
            res.json(keyArray);
          }
        }    
      });
    } else {
       logger.info("Loading from cache ADUsers?search"+search);
       logger.info(util.inspect(value, {showHidden: false, depth: null}));
       res.json(value);
      //{ my: "Special", variable: 42 }
      // ... do something ...
    }
  }
});

 
}

exports.getUsersAndGroups = function(req, res) {
  var ActiveDirectory = require('activedirectory');
  var ADconfig = { 
    url: config.ldap.url,
    bindDN: config.ldap.bindDN, 
    bindCredentials: config.ldap.bindCredentials, 
    baseDN: config.ldap.searchBase
 }

  var ad = new ActiveDirectory(ADconfig);

  var search = req.query.search || 'a';

  var opts = {
    filter:'(|'+
      '(&(objectClass=group)(!(objectClass=computer))(!(objectClass=user))(!(objectClass=person))(CN=*'+search+'*))'+
     '(&(objectClass=user)(sAMAccountName=*'+search+'*)))',
   // filter: '(&(objectClass=user)(sAMAccountName=*'+search+'*))', //'(&(objectCategory=Person)(sAMAccountName=*))' (!userAccountControl:1.2.840.113556.1.4.803:=2)
   // attributes: [ 'sAMAccountName', 'userPrinicipalName', 'displayName' ],
    sizeLimit : 0
  };

  // var query = 'CN=*'+search+'*';
  console.log(opts);

  myCache.get("ADUserGroups?search="+search, function( err, value ){
    if( !err ){
      if(value == undefined){
        // key not found
        ad.find(opts, function(err, records) {
          if (err) {
            console.log(err)
            console.log('ERROR: ' +JSON.stringify(err));
            res.status(400).send(err);
          } else {
            if ((! records) || (records.length == 0)) {
              console.log('No users found.');
              res.json({});
            }
            else {
              logger.info('find: '+JSON.stringify(records));
              var keyArray = records.users.map(function(item) { 
                return { 
                'sAMAccountName' : item["sAMAccountName"],
                'displayName' : item["displayName"],
                'ADtype': "user",
                }
              });

              var keyArray2 = records.groups.map(function(item) { 
                return { 
                'sAMAccountName' : item["cn"],
                'displayName' : item["cn"],
                'ADtype': 'group',
                }
              });

              myCache.set( "ADUserGroups?search="+search, keyArray.concat(keyArray2), 10000 );  
              res.json(keyArray.concat(keyArray2));
            }
          }    
        });
      } else {
          logger.info("Loading from cache ADUserGroups?search"+search);
          logger.info(util.inspect(value, {showHidden: false, depth: null}));
          res.json(value);
      }
    }
  });

  
}

