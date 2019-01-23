'use strict';

/**
 * Module dependencies.
 */
var _ = require('lodash'),
  config = require('../config'),
  chalk = require('chalk'),
  path = require('path'),
  Connection = require('tedious').Connection;
  


var config = {
	username: config.sql.username, // update me
	password: config.sql.password, // update me
  server: config.sql.server,
  options: {
    database: config.sql.db,
    encrypt: true,
    rowCollectionOnRequestCompletion: true
  }
}



module.exports.getConnction = function() {
	var connection = new Connection(config);
	return connection;
}
