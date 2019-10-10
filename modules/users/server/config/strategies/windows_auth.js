var passport = require('passport'),
  WindowsStrategy = require('passport-windowsauth'),
  _ = require('lodash'),
	path = require("path"),
	moment = require('moment'),
  util = require('util'),
  logger = require(path.resolve('./config/lib/log')),
  users = require('../../controllers/users.server.controller');
	config = require(path.resolve('./config/config'));
	
	var customTimestamp = function(){
		var formattedDate = moment().format('MMM Do YYYY, h:mm:ss a');
		return formattedDate;
	};
 
module.exports = function (config) {
	passport.use(new WindowsStrategy({
	  ldap: {
	      url: config.ldap.url,
	      bindDN: config.ldap.bindDN, 
	      bindCredentials: config.ldap.bindCredentials, 
	     base: config.ldap.searchBase,
		 //search_query: '(&(ObjectClass=user)(sAMAccountName={0})(l=*)(extensionAttribute2=*))'
	  },
	  passReqToCallback: true,
	  getUserNameFromHeader: function (req) {
			if (!req.headers['x-iisnode-logon_user']) return null;
			logger.info(customTimestamp() + " "+ req.headers['x-iisnode-logon_user']);
	    
			//return req.headers['x-iisnode-logon_user'].split('\\')[1];
			logger.info("name is"+req.headers['x-iisnode-logon_user'].substring(11));
	    return req.headers['x-iisnode-logon_user'].substring(11);
	  }
	}, function(req, profile, done){

		logger.info(customTimestamp() + "  got the profile info");
		var providerData = {};
		providerData.memberOf = profile._json.memberOf;
		
		//decide role of the user
		var isAdmin = _.some(profile._json.memberOf, _.method('match', /CN=EMAGStorage/i));

		providerData.email = profile._json.userPrincipalName || 'test@test.com';
		providerData.city = profile._json.l;
		providerData.projectCode = profile._json.extensionAttribute2;

    // Create the user OAuth profile
    	var providerUserProfile = {
			firstName: profile._json.givenName,
			lastName: profile._json.sn,
			displayName: profile._json.displayName,
			email: profile._json.userPrincipalName || 'test@test.com',
			roles: isAdmin ? ['admin'] : ['user'],
			username: profile._json.sAMAccountName,
			profileImageURL: (profile._json.pictureUrl) ? profile._json.pictureUrl : undefined,
			provider: 'activeDirectory',
			providerIdentifierField: 'email',
			providerData: providerData
		};	

		console.log("providerUserProfile", providerUserProfile)		


    	// Save the user OAuth profile
    	users.saveOAuthUserProfile(req, providerUserProfile, done);

	}));
}