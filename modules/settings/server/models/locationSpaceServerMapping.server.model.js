'use strict';

/**
 * Module dependencies
 */
var mongoose = require('mongoose'),
  Schema = mongoose.Schema,
  path = require('path'),
  config = require(path.resolve('./config/config')),
  chalk = require('chalk');

/**
 * Share Schema
 */
var settingSchema = new Schema({
  location: {
    type: String,
    trim: true,
    required: 'Location cannot be blank'
  },
  space: {
    type: Number,
    trim: true,
    required: 'Space required',
    validate : {
      validator : Number.isFinite,
      message   : '{VALUE} is not a valid  value for size'
    }     
  },
  cost: {
    type: Number,
    min: [0, 'Cost should be greater than or equal to 0'],
    //max: [16384, 'Share Size should be lesser than or equal to 16384'],
    trim: true,
    required: 'Total cost required' ,
    validate : {
      validator : Number.isInteger,
      message   : '{VALUE} is not an integer value for size'
    }  
  }
});

settingSchema.index({
    location:'text', 
    space: 'text'
});

mongoose.model('location_space_cost_mapping', settingSchema);


