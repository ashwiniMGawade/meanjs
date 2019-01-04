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
	      url: 'ldap://10.128.113.50',
	      bindDN: 'uid=administrator,ou=users,dc=ausngs,dc=netapp,dc=au', // 'cn='root''
	      bindCredentials: 'netapp1', //Password for bindDN
	      searchBase: 'ou=users,dc=ausngs,dc=netapp,dc=au',
		  searchFilter: '(uid={{username}})'
		},
	  	usernameField: 'usernameOrEmail',
		//searchAttributes: ['displayName', 'mail'],
		passReqToCallback: true
	    
	  },
	  function(req, user, done) {
		  //code to authenticate
		  console.log("##########################################")
		  console.log(user)
		  done(null, user);
		}
	));
}