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
	      url: 'LDAP://192.168.200.51:389/DC=AD,DC=INFOSYS,DC=COM',
	      bindDN: 'CN=_VFMAdmin,OU=SPL,OU=Users,OU=KEC,OU=BLR,OU=IND,DC=ad,DC=infosys,DC=com', // 'cn='root''
	      bindCredentials: '%Serv1Df$@5#', //Password for bindDN
	      searchBase: 'DC=AD,DC=INFOSYS,DC=COM',
		  searchFilter: '(&(ObjectClass=user)(sAMAccountName={{username}})(l=*)(extensionAttribute2=*))'
		},
	  	usernameField: 'usernameOrEmail',
		//searchAttributes: ['displayName', 'mail'],
		passReqToCallback: true
	    
	  },
	  function(req, user, done) {
		  // Set the provider data and include tokens
		console.log(user)
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
