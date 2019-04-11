'use strict';

var mysql = require('mysql2'),
    path = require('path'),
    util = require('util'),
    config = require(path.resolve('./config/config'));

//To be enabled in case of Event Emitter error (However ConnectionPool fixes the issue for Event Emitter)
//Keeping this until all works well (to be removed when Event Emitter error does not reoccur)
//require('events').EventEmitter.defaultMaxListeners = Infinity;


console.log(config.wfa.sql);
config.wfa.sql.database = '';
var connectionPool = mysql.createPool(config.wfa.sql);
var getCifsShare, getClusterInfo, getCifsShareACLGroups;

getCifsShare = function (location, volumename, res) {
  var cifsShare = {
    sharename: '',
    sharepath: '',
    clustername:'',
    vservername:'',
    volumename:'',
  };
  var cifsShareDetails;
  getClusterInfo(location, function(err, details) {
    if (err) {
      console.log('Server error in getting cluster information' + err);
      res(err, cifsShare);
    }
    cifsShareDetails = details;
    console.log('Server getCifsShare: MySQL Read: Retrieving Admin Vserver for location: \"' + location + '\" and volumename \"' + volumename + '\".');

    var args = ' SELECT '+
      'cm_storage.cifs_share.name AS ShareName, ' +
      'cm_storage.cluster.name AS ClusterName,' +
      'cm_storage.cluster.primary_address AS ClusterIP, ' +
      'cm_storage.vserver.name AS VserverName, ' +
      'cm_storage.volume.name AS VolumeName, ' +
      'cm_storage.cifs_share.path AS Path ' +            
    'FROM ' +
      'cm_storage.cifs_share,' +
      'cm_storage.vserver,' +
      'cm_storage.volume,' +
      'cm_storage.cluster  ' + 
    'where ' +
      'cm_storage.volume.junction_path = SUBSTRING_INDEX(cm_storage.cifs_share.path, "/", 2)  '+ 
      'AND cm_storage.vserver.id = cm_storage.cifs_share.vserver_id  '+     
      'AND cm_storage.volume.vserver_id = cm_storage.vserver.id  '+  
      'AND cm_storage.cifs_share.name NOT LIKE "%$%" '+  
      'AND cm_storage.cluster.id = cm_storage.vserver.cluster_id   '+  
      'AND LOWER(cm_storage.vserver.name) = LOWER(?)  '+ 
      'AND ( '+
          'LOWER(cm_storage.cluster.name) = LOWER(?) '+                              
          'OR LOWER(cm_storage.cluster.primary_address) = LOWER(?) ' +   
      ')' +                                                                      
      'AND LOWER(cm_storage.volume.name)= LOWER(?)  ' ;

    console.log('Server getCifsShare: MySQL Read: Query: ' + util.inspect(args, {showHidden: false, depth: null}));

    connectionPool.getConnection(function(err, connection) {
      if(err){
        console.log('Server getCifsShare: MySQL Read: Connection Error: ' + err);
        res(err, cifsShare);
      } else {
        connection.query(
          args, 
          [
            cifsShareDetails.primaryvserver.toLowerCase(),
            cifsShareDetails.primarycluster.toLowerCase(),
            cifsShareDetails.primarycluster.toLowerCase(),
            volumename.toLowerCase()
          ], function (err, result) {
            console.log('Server getCifsShare: MySQL Read: Result: ' + util.inspect(result, {showHidden: false, depth: null}));
            if (err) {
              console.log('Server getCifsShare: MySQL Read: Error: ' + err);
              res(err, cifsShare);
            } else if (result.length > 0) {
                cifsShare.sharename = result[0].ShareName;
                cifsShare.sharepath = result[0].Path;
                cifsShare.vservername = result[0].VserverName;
                cifsShare.clustername = result[0].ClusterName;
                cifsShare.volumename = result[0].VolumeName;
              
              res(null, cifsShare);
            } else {
              console.log('Server getAdminVserver(): MySQL Read: No Records found');
              res("Server Read: No records found", cifsShare);
            }
            connection.release();
        });
      }
    });
  });  
};

getClusterInfo = function (location, res) {

  console.log('Server getClusterInfo: MySQL Read: Retrieving Admin Vserver for location: \"' + location + '\" ');

  var cifsShare = {
    primarycluster:'',
    primaryvserver:'',
    secondarycluster: '',
    secondaryvserver: ''
  };

  var args = ' Select '+
  'locationmapping.locationmapping.pcluster as primarycluster, locationmapping.locationmapping.pvserver primaryvserver,  locationmapping.locationmapping.scluster as secondarycluster, locationmapping.locationmapping.svserver secondaryvserver '+
  'FROM ' +
  'locationmapping.locationmapping ' +
  'WHERE ' +
  'LOWER(locationmapping.locationmapping.plocation) = ? ';

   console.log('Server getClusterInfo: MySQL Read: Query: ' + util.inspect(args, {showHidden: false, depth: null}));

  connectionPool.getConnection(function(err, connection) {
    if(err){
      console.log('Server getClusterInfo: MySQL Read: Connection Error: ' + err);
      res(err, cifsShare);
    }else{
      connection.query(args, [location.toLowerCase()], function (err, result) {
        console.log('Server getClusterInfo: MySQL Read: Result: ' + util.inspect(result, {showHidden: false, depth: null}));
        if (err) {
          console.log('Server getClusterInfo: MySQL Read: Error: ' + err);
          res(err, cifsShare);
        } else if (result.length > 0) {
            cifsShare.primarycluster = result[0].primarycluster;
            cifsShare.primaryvserver = result[0].primaryvserver;
            cifsShare.secondarycluster = result[0].secondarycluster;
            cifsShare.secondaryvserver = result[0].secondaryvserver;
          
          res(null, cifsShare);
        } else {
          console.log('Server getClusterInfo(): MySQL Read: No Records found');
          res("Server Read: No records found", cifsShare);
        }
        connection.release();
      });
    }
  });
};

getCifsShareACLGroups = function(sharename, res) {
  console.log('Server getCifsShareACLGroups: MySQL Read: Retrieving acl groups of the share: \"' + sharename + '\" ');

  var args = 'SELECT ' +
  'DISTINCT SUBSTRING_INDEX(cm_storage.cifs_share_acl.user_or_group,"\\\\",-1) as groupName '+   
  'FROM '+
  'cm_storage.cifs_share_acl, '+
  'cm_storage.cifs_share '+                      
  'WHERE '+
  'cm_storage.cifs_share.id = cm_storage.cifs_share_acl.cifs_share_id '+  
  'AND LOWER(cm_storage.cifs_share.name) = ? '+                                              
  'AND LOWER(cm_storage.cifs_share_acl.user_or_group) LIKE ?';

  console.log('Server getCifsShareACLGroups: MySQL Read: Query: ' + util.inspect(args, {showHidden: false, depth: null}));

  console.log([sharename.toLowerCase(), "%"+sharename.toLowerCase()+"%"])

  connectionPool.getConnection(function(err, connection) {
    if(err){
      console.log('Server getCifsShareACLGroups: MySQL Read: Connection Error: ' + err);
      res(err, cifsShare);
    }else{
      connection.query(args, [sharename.toLowerCase(), "%"+sharename.toLowerCase()+"%"], function (err, result) {
        console.log('Server getCifsShareACLGroups: MySQL Read: Result: ' + util.inspect(result, {showHidden: false, depth: null}));
        if (err) {
          console.log('Server getCifsShareACLGroups: MySQL Read: Error: ' + err);
          res(err, {});
        } else if (result.length > 0) {          
          res(null, result);
        } else {
          console.log('Server getClusterInfo(): MySQL Read: No Records found');
          res("Server Read: No records found", {});
        }
        connection.release();
      });
    }
  });
};

exports.getCifsShare = getCifsShare;
exports.getClusterInfo = getClusterInfo;
exports.getCifsShareACLGroups = getCifsShareACLGroups;
