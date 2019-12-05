'use strict';

var validator = require('validator'),
  path = require('path'),
  mongoose = require('mongoose'),
  logger = require(path.resolve('./config/lib/log')),
  LocationSpaceCostMapping = mongoose.model('location_space_cost_mapping'),
  util = require('util'),
  config = require(path.resolve('./config/config'));

/**
 * List of Shares
 */
exports.Settingslist = function (req, res) {
    
    logger.info("list location space cost mapping  called");
    var location = req.query.location || "";
    var query = {};
    if (location) {
        query.location = new RegExp( location, "i")
    }
    var queryex = LocationSpaceCostMapping.find(query).exec(function (err, data) {
        if (err) {
            return res.status(422).send({
            message: errorHandler.getErrorMessage(err)
            });
        }
        res.json({'settings': data});
    });
}

exports.update = function(req, res) {
    var setting = req.model;
    setting.cost = req.body.cost || setting.cost;
    logger.info("updating request for lcoation = "+setting.location  +" cost ="+ setting.cost);
    setting.save(function (err, settingData) {
      if (err) {
        console.log("error in saving the status", err)
        return res.status(400).send({
            message: err.message
          });
      } else {
        res.json(settingData);
      }       
    });
}

/**
 * Settings middleware
 */
exports.settingByID = function (req, res, next, id) {
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).send({
        message: 'Setting is invalid'
      });
    }
  
    LocationSpaceCostMapping.findById(id).exec(function (err, setting) {
      if (err) {
        return next(err);
      } else if (!setting) {
        return next(new Error('Failed to load user ' + id));
      }
  
      req.model = setting;
      next();
    });
  };