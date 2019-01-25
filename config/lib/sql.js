'use strict';

const util=require("util");


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
    type: config.sql.authType,
    options: {
      userName: config.sql.username, 
	    password: config.sql.password, 
	    domain: config.sql.domain
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
      console.log(util.inspect(connection, {showHidden: false, depth: 4}))
      throw err;
    }
    cb(connection);
  });
}
