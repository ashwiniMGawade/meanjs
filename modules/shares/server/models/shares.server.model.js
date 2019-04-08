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
var ShareSchema = new Schema({
  created: {
    type: Date,
    default: Date.now
  },
  city: {
    type: String,
    default: '',
    trim: true,
    required: 'City cannot be blank'
  },
  projectCode: {
    type: String,
    default: '',
    trim: true,
    required: 'Project Code cannot be blank'
  },
  newName: {
    type: String,
    default: '',
    trim: true,
    match: [ /^[a-zA-Z\-0-9\._]+$/ , 'newName: Only alphanumeric chars including dash and underscore are allowed.'],
    required: function() { return this.category === 'rename' ? 'New name can not be blank' : false; },
  },
  bu: {
    type: String,
    default: '',
    trim: true,
    required: 'Business Unit cannot be blank'
  },
  comment: {
    type: String,
    default: '',
    trim: true
  },
  readOnly: {
    type: String,
    default: '',
    trim: true,
    required: function() { return this.category === 'newShare' ? 'Read Only Users cannot be blank' : false; },
    match: [ /^[a-zA-Z\-0-9\._]*(?:;([a-zA-Z\-0-9\._])+)*$/ , 'readOnly: Only semicolon separated userIDs allowed']
  },
  readAndWrite: {
    type: String,
    default: '',
    trim: true,
    required: function() { return this.category === 'newShare' ? 'Read And Write Only Users cannot be blank': false },
    match: [ /^[a-zA-Z\-0-9\._]*(?:;([a-zA-Z\-0-9\._])+)*$/ , 'readAndWrite: Only semicolon separated userIDs allowed']
  },
  readWriteAndModify: {
    type: String,
    default: '',
    trim: true,
    required: function() { return this.category === 'newShare' ?'Read Write And Modify Users cannot be blank': false },   
    match: [ /^[a-zA-Z\-0-9\._]*(?:;([a-zA-Z\-0-9\._])+)*$/ , 'readWriteAndModify: Only semicolon separated userIDs allowed']
  },
  storage: {},
  sizegb: {
    type: Number,
    min: [1, 'Share Size should be greater than or equal to 1'],
    max: [16384, 'Share Size should be lesser than or equal to 16384'],
    trim: true,
    required: function() { return this.category === 'newShare' ?'Share size required' : false },
    validate : {
      validator : Number.isInteger,
      message   : '{VALUE} is not an integer value for size'
    }
  },
  cost: {
    type: Number,
    min: [1, 'Cost should be greater than or equal to 1'],
    //max: [16384, 'Share Size should be lesser than or equal to 16384'],
    trim: true,
    required: function() { return this.category === 'newShare' ?'Share cost required' : false },
    validate : {
      validator : Number.isInteger,
      message   : '{VALUE} is not an integer value for cost'
    }
  },
  status: {
    type: String,
    default: 'Pending Approval',
    enum: {
            values: ['Pending Approval', 'Approved', 'Completed', 'Processing', 'Contact Support', 'Rejected'],
            message: '`{VALUE}` not a valid value for Status'
          }
  },
  category: {
    type: String,
    required: 'Share category required',
    enum: {
            values: ['newShare', 'changePermission', 'resize', 'rename', 'restoreProjectShare', 'retireVolumeWorkflow', 'migration'],
            message: '`{VALUE}` not a valid value for Category'
          }
  },
  user: {
    type: Schema.ObjectId,
    ref: 'User'
  },
  approvers: {
    type: String,
    default: '',
    trim: true,
    required: 'Project approvers cannot be blank'
  }
});

mongoose.model('Share', ShareSchema);

