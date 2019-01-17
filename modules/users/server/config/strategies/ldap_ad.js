'use strict';

/**
 * Module dependencies
 */
var passport = require('passport'),
  LdapStrategy = require('passport-ldapauth'),
  users = require('../../controllers/users.server.controller');


module.exports = function (config) {
  // Use active directory strategy
	passport.use(new LdapStrategy({
	    server: {
	      url: 'ldap://10.128.113.50:389',
	      bindDN: 'nse-dc-admin@ausngs.netapp.au', // 'cn='root''
	      bindCredentials: 'Qwerty1234%', //Password for bindDN
	      searchBase: 'cn=users,dc=ausngs,dc=netapp,dc=au',
		  searchFilter: '(samaccountname={{username}})'
		},
	  	usernameField: 'usernameOrEmail',
		//searchAttributes: ['displayName', 'mail'],
		passReqToCallback: true
	    
	  },
	  function(req, user, done) {
		  // Set the provider data and include tokens
		    var providerData = {};
		    providerData.memberOf = user.memberOf;
		    providerData.email = user.userPrincipalName

		    //Decide user role


		    // Create the user OAuth profile
		    var providerUserProfile = {
		      firstName: user.givenName,
		      lastName: user.sn,
		      displayName: user.displayName,
		      email: user.userPrincipalName,
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