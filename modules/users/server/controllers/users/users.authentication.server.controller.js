'use strict';

/**
 * Module dependencies
 */
var path = require('path'),
  errorHandler = require(path.resolve('./modules/core/server/controllers/errors.server.controller')),
  path = require('path'),
   util = require('util'),
  moment = require('momnet'),
  logger = require(path.resolve('./config/lib/log')),
  mongoose = require('mongoose'),
  passport = require('passport'),
  User = mongoose.model('User');

// URLs for which user can't be redirected on signin
var noReturnUrls = [
  '/authentication/signin',
  '/authentication/signup'
];

var customTimestamp = function(){
  var formattedDate = moment().format('MMM Do YYYY, h:mm:ss a');
  return formattedDate;
};

/**
 * Signup
 */
exports.signup = function (req, res) {
  // For security measurement we remove the roles from the req.body object
  delete req.body.roles;

  // Init user and add missing fields
  var user = new User(req.body);
  user.provider = 'local';
  user.displayName = user.firstName + ' ' + user.lastName;

  // Then save the user
  user.save(function (err) {
    if (err) {
      return res.status(422).send({
        message: errorHandler.getErrorMessage(err)
      });
    } else {
      // Remove sensitive data before login
      user.password = undefined;
      user.salt = undefined;

      req.login(user, function (err) {
        if (err) {
          res.status(400).send(err);
        } else {
          res.json(user);
        }
      });
    }
  });
};

/**
 * Signin after passport authentication
 */
// exports.signin = function (req, res, next) {
//   console.log("called here");
//   console.log(req.headers);
//   passport.authenticate('local', function (err, user, info) {
//     if (err || !user) {
//       res.status(422).send(info);
//     } else {
//       // Remove sensitive data before login
//       user.password = undefined;
//       user.salt = undefined;

//       req.login(user, function (err) {
//         if (err) {
//           res.status(400).send(err);
//         } else {
//           res.json(user);
//         }
//       });
//     }
//   })(req, res, next);
// };

	


exports.signin = function( req, res, next) {  

  logger.info(customTimestamp() +"inside signin");

  if (req.isAuthenticated()) {
    // already logged in 
    logger.info(customTimestamp() +"already logged in");
    next();
  }
  else {
    logger.info(util.inspect(req.headers, {showHidden: false, depth: null}));
     passport.authenticate('WindowsAuthentication', function (err, user, info) {
        if (err || !user) {
          res.status(422).send(info);
        } else {
          logger.info(customTimestamp() + "  user logged in");
          // Remove sensitive data before login
          user.password = undefined;
          user.salt = undefined;

          console.log(user);

          req.login(user, function (err) {
            if (err) {
              res.status(400).send(err);
            } else {
              //res.json(user);
              logger.info("user is logged in");
              next();
            }
          });
        }
    })(req, res, next);
  }
}

//LDAP SIGNIN
/*exports.signin = function (req, res, next) {
 
  passport.authenticate('ldapauth', function (err, user, info) {
    console.log(err, "err", user, "user", info, "info")
    if (err || !user) {
      res.status(422).send(info);
    } else {
      // Remove sensitive data before login
      user.password = undefined;
      user.salt = undefined;

      console.log(user);

      req.login(user, function (err) {
        console.log("err in logging in user", err)
        if (err) {
          console.log("inside error")
          res.status(400).send(err);
        } else {
          console.log("inside else")
          res.json(user);
        }
      });
    }
  })(req, res, next);
};
*/

/**
 * Signout
 */
exports.signout = function (req, res) {
  req.logout();
  res.redirect('/');
};

/**
 * OAuth provider call
 */
exports.oauthCall = function (req, res, next) {
  var strategy = req.params.strategy;
  // Authenticate
  passport.authenticate(strategy)(req, res, next);
};

/**
 * OAuth callback
 */
exports.oauthCallback = function (req, res, next) {
  var strategy = req.params.strategy;

  // info.redirect_to contains inteded redirect path
  passport.authenticate(strategy, function (err, user, info) {
    if (err) {
      return res.redirect('/authentication/signin?err=' + encodeURIComponent(errorHandler.getErrorMessage(err)));
    }
    if (!user) {
      return res.redirect('/authentication/signin');
    }
    req.login(user, function (err) {
      if (err) {
        return res.redirect('/authentication/signin');
      }

      return res.redirect(info.redirect_to || '/');
    });
  })(req, res, next);
};

/**
 * Helper function to save or update a OAuth user profile
 */
exports.saveOAuthUserProfile = function (req, providerUserProfile, done) {
  // console.log("save oauth user profile called", providerUserProfile)
  // Setup info and user objects
  var info = {};
  var user;

  // Set redirection path on session.
  // Do not redirect to a signin or signup page
  if (noReturnUrls.indexOf(req.session.redirect_to) === -1) {
    info.redirect_to = req.session.redirect_to;
  }

  // Define a search query fields
  var searchMainProviderIdentifierField = 'providerData.' + providerUserProfile.providerIdentifierField;
  var searchAdditionalProviderIdentifierField = 'additionalProvidersData.' + providerUserProfile.provider + '.' + providerUserProfile.providerIdentifierField;

  // Define main provider search query
  var mainProviderSearchQuery = {};
  mainProviderSearchQuery.provider = providerUserProfile.provider;
  mainProviderSearchQuery[searchMainProviderIdentifierField] = providerUserProfile.providerData[providerUserProfile.providerIdentifierField];

  // Define additional provider search query
  var additionalProviderSearchQuery = {};
  additionalProviderSearchQuery[searchAdditionalProviderIdentifierField] = providerUserProfile.providerData[providerUserProfile.providerIdentifierField];

  // Define a search query to find existing user with current provider profile
  var searchQuery = {
    $or: [mainProviderSearchQuery, additionalProviderSearchQuery]
  };

  // console.log("search query:", searchQuery)

  // Find existing user with this provider account
  User.findOne(searchQuery, function (err, existingUser) {
    if (err) {
      return done(err);
    }

    if (!req.user) {
      if (!existingUser) {
        var possibleUsername = providerUserProfile.username || ((providerUserProfile.email) ? providerUserProfile.email.split('@')[0] : '');

        User.findUniqueUsername(possibleUsername, null, function (availableUsername) {
          user = new User({
            firstName: providerUserProfile.firstName,
            lastName: providerUserProfile.lastName,
            username: availableUsername,
            roles:providerUserProfile.roles,
            displayName: providerUserProfile.displayName,
            profileImageURL: providerUserProfile.profileImageURL,
            provider: providerUserProfile.provider,
            providerData: providerUserProfile.providerData
          });

          // Email intentionally added later to allow defaults (sparse settings) to be applid.
          // Handles case where no email is supplied.
          // See comment: https://github.com/meanjs/mean/pull/1495#issuecomment-246090193
          user.email = providerUserProfile.email;

          // And save the user
          user.save(function (err) {
            return done(err, user, info);
          });
        });
      } else {
        modifyUserInfo(existingUser,providerUserProfile, done, info)
      }
    } else {
      // User is already logged in, join the provider data to the existing user
      user = req.user;

      // Check if an existing user was found for this provider account
      // if (existingUser) {
      //   if (user.id !== existingUser.id) {
      //     return done(new Error('Account is already connected to another user'), user, info);
      //   }

      //   return done(new Error('User is already connected using this provider'), user, info);
      // }
      modifyUserInfo(user,providerUserProfile, done, info)
     
    }
  });
};


var modifyUserInfo = function(user, providerUserProfile, done, info) {
    // Add the provider data to the additional provider data field
    if (!user.additionalProvidersData) {
      user.additionalProvidersData = {};
    }

    user.additionalProvidersData[providerUserProfile.provider] = providerUserProfile.providerData;
    //update the provider data to the latest values
    user.providerData = providerUserProfile.providerData;
    user.roles = providerUserProfile.roles;

    // Then tell mongoose that we've updated the additionalProvidersData field
    user.markModified('additionalProvidersData');
    user.markModified('providerData');

    // And save the user
    user.save(function (err) {
      return done(err, user, info);
    });
} 


/**
 * Remove OAuth provider
 */
exports.removeOAuthProvider = function (req, res, next) {
  var user = req.user;
  var provider = req.query.provider;

  if (!user) {
    return res.status(401).json({
      message: 'User is not authenticated'
    });
  } else if (!provider) {
    return res.status(400).send();
  }

  // Delete the additional provider
  if (user.additionalProvidersData[provider]) {
    delete user.additionalProvidersData[provider];

    // Then tell mongoose that we've updated the additionalProvidersData field
    user.markModified('additionalProvidersData');
  }

  user.save(function (err) {
    if (err) {
      return res.status(422).send({
        message: errorHandler.getErrorMessage(err)
      });
    } else {
      req.login(user, function (err) {
        if (err) {
          return res.status(400).send(err);
        } else {
          return res.json(user);
        }
      });
    }
  });
};



/**
 * Authentication for User creation through windows 
 */
exports.loginODIN = function (req, res, next) {
  if (!req.headers.authorization && req.isAuthenticated()) {
    // Not ODIN user continue normal flow
    next();
  }
  else {
    if (!req.headers.authorization) {
      return res.status(401).json({
          message: 'Authentication required!'
        });
    }
    // User not logged in, login as ODIN (LDAP)
    var parts = req.headers.authorization.split(' ')
    if (parts.length < 2) { return this.fail(400); }
  
    var scheme = parts[0]
    , credentials = new Buffer(parts[1], 'base64').toString().split(':');

    req.query.username = credentials[0]
    req.query.password = credentials[1]

    passport.authenticate('ldapauth', function (err, user, info) {
      if (err || !user) {
        passport.authenticate('basic', { session: false }, function (err, user) {
          if (user === false) {
            // Invalid user or user not authorized
            return res.status(401).json({
              message: 'Invalid username/password'
            });
          }
          else {
            loginODINUser(req, res, next, user)     
          }
        })(req, res, next);
      } else {
        loginODINUser(req, res, next, user) 
      }
      })(req, res, next);    
  }
};