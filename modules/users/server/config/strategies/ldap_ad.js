'use strict';

/**
 * Module dependencies
 */
var passport = require('passport'),
	LdapStrategy = require('passport-ldapauth'),
	_ = require('lodash'),
  users = require('../../controllers/users.server.controller'),
  path = require("path"),
  config = require(path.resolve('./config/config'));

module.exports = function (config) {
  // Use active directory strategy
	passport.use(new LdapStrategy({
	    server: {
	      url: config.ldap.url,
	      bindDN: config.ldap.bindDN, 
	      bindCredentials: config.ldap.bindCredentials, 
	      searchBase: config.ldap.searchBase,
		 		searchFilter: '(&(ObjectClass=user)(sAMAccountName={{username}})(l=*)(extensionAttribute2=*))'
		},
	  	usernameField: 'usernameOrEmail',
		//searchAttributes: ['displayName', 'mail'],
		passReqToCallback: true
	    
	  },
	  function(req, user, done) {
		  // Set the provider data and include tokens
		    var providerData = {};
				providerData.memberOf = user.memberOf;
				
				//decide role of the user
				var isAdmin = _.some(user.memberOf, _.method('match', /CN=EMAGStorage/i));

				providerData.email = user.userPrincipalName;
				providerData.city = user.l;
				providerData.projectCode = user.extensionAttribute2;

		    // Create the user OAuth profile
		    var providerUserProfile = {
		      firstName: user.givenName,
		      lastName: user.sn,
		      displayName: user.displayName,
					email: user.userPrincipalName,
					roles: isAdmin ? ['admin'] : ['user'],
		      username: user.sAMAccountName,
		      profileImageURL: (user.pictureUrl) ? user.pictureUrl : undefined,
		      provider: 'activeDirectory',
		      providerIdentifierField: 'email',
		      providerData: providerData
				};			


		    // Save the user OAuth profile
		    users.saveOAuthUserProfile(req, providerUserProfile, done);
		}
	));
}
