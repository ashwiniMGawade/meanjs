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
  volumeName: {
    type: String,
    default: '',
    trim: true,
    match: [ /^[a-zA-Z\-0-9\._]+$/ , 'volumeName: Only alphanumeric chars including dash and underscore are allowed.'],
    required: function() { return this.category === 'newVolume' ? 'Volume name can not be blank' : false; },
  },
  comment: {
    type: String,
    default: '',
    trim: true
  },
  resizeReason: {
    type: String,
    trim: true,
    required: function() { return this.category === 'resize' ?'Reason for resize is required' : false },
  },
  readOnly: {
    type: String,
    default: '',
    trim: true,
    required: function() { return this.category === 'newShare' ? 'Read Only Users cannot be blank' : false; },
    match: [ /^[a-zA-Z\-0-9 \._]*(?:;([a-zA-Z\-0-9 \._])+)*$/ , 'readOnly: Only semicolon separated userIDs or group names allowed']
  },
  readAndWrite: {
    type: String,
    default: '',
    trim: true,
    required: function() { return this.category === 'newShare' ? 'Read And Write Only Users cannot be blank': false },
    match: [ /^[a-zA-Z\-0-9 \._]*(?:;([a-zA-Z\-0-9 \._])+)*$/ , 'readAndWrite: Only semicolon separated userIDs or group names allowed']
  },
  readWriteAndModify: {
    type: String,
    default: '',
    trim: true,
    required: function() { return this.category === 'newShare' ?'Read Write And Modify Users cannot be blank': false },   
    match: [ /^[a-zA-Z\-0-9 \._]*(?:;([a-zA-Z\-0-9 \._])+)*$/ , 'readWriteAndModify: Only semicolon separated userIDs or group names allowed']
  },
  acl_users: {
    type: String,
    default: '',
    trim: true,
    required: function() { return (this.category === 'changePermission' && (this.operation == 'addUserToADGroup'|| this.operation == 'removeUserFromADGroup') )? 'ACL Users cannot be blank': false },
    match: [ /^[a-zA-Z\-0-9\._]*(?:;([a-zA-Z\-0-9\._])+)*$/ , 'ACL User: Only semicolon separated userIDs allowed']
  },
  operation: {
    type:String,
    required: function() { return this.category === 'changePermission' ? 'ACL Operation is required': false },
    enum: {
            values: Object.keys(config.shared.share.allowedChangePermissionOperations),
            message: '`{VALUE}` not a valid value for ACL Operation'
          }
  },
  acl_group:{
    type:String,
    required: function() { return (this.category === 'changePermission' && this.operation != 'addUserOrGroupToShare') ? 'ACL Group is required': false }
  },
  userOrGroupName: {
    type: String,
    default: '',
    trim: true,
    required: function() { return (this.category === 'changePermission' && this.operation == 'addUserOrGroupToShare') ? 'User or group name cannot be blank': false },
    match: [ /^[a-zA-Z\-0-9 \._]*$/ , 'User or group name can only contain alpha numeric chars including ., _ and space ']
  },
  userOrGroupPermissions: {
    type:String,
    required: function() { return (this.category === 'changePermission' && this.operation == 'addUserOrGroupToShare') ? 'Permissions are required': false },
    enum: {
            values: Object.keys(config.shared.share.allowedPermissions),
            message: '`{VALUE}` not a valid value for ACL Permission'
          }
  },
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
  },
  newSizegb: {
    type: Number,
    max: [16384, 'Share Size should be lesser than or equal to 16384'],
    trim: true,
    required: function() { return this.category === 'resize' ?'New Share size required' : false },
    validate : {
      validator : Number.isInteger,
      message   : '{VALUE} is not an integer value for size'
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
            values: Object.keys(config.shared.share.categories),
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
  },
  error: {}
});

ShareSchema.index({
  city:'text', 
  projectCode: 'text', 
  bu: 'text', 
  status: 'text', 
  category: 'text', 
  approvers: 'text', 
  //user.name: 'text'
});

mongoose.model('Share', ShareSchema);


