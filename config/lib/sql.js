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
  authentication:{
    type:"default",
    options: {
      userName: config.sql.username, // update me
	    password: config.sql.password, // update me
    }
  },	
  server: config.sql.server,
  options: {
    database: config.sql.db,
    encrypt: true,
    rowCollectionOnRequestCompletion: true
  }
}



module.exports.getConnction = function(cb) {
  var connection = new Connection(config);
  connection.on('connect', function(err) {
    if (err) {
      console.log('Connection Failed');
      throw err;
    }
    cb(connection);
  });
}
