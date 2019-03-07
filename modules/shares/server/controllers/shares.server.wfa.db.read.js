'use strict';

var mysql = require('mysql2'),
    path = require('path'),
    util = require('util'),
    config = require(path.resolve('./config/config'));

//To be enabled in case of Event Emitter error (However ConnectionPool fixes the issue for Event Emitter)
//Keeping this until all works well (to be removed when Event Emitter error does not reoccur)
//require('events').EventEmitter.defaultMaxListeners = Infinity;


var connectionPool = mysql.createPool(config.wfa.sql);
exports.getCifsShare = function (location, volumename, res) {

  console.log('Server getCifsShare: MySQL Read: Retrieving Admin Vserver for location: \"' + location + '\" and volumename \"' + volumename + '\".');

  var cifsShare = {
    sharename: '',
    sharepath: '',
    clustername:'',
    vservername:'' 
  };

  var args = ' Select '+
  'cm_storage.cluster.name as clustername, cm_storage.vserver.name vservername, cm_storage.cifs_share.name sharename, cm_storage.cifs_share.path sharepath '+
  'FROM ' +
  'cm_storage.vserver, ' +
  'cm_storage.cluster,' +
  'cm_storage.cifs_share, ' +
  'cm_storage.volume ' + 
  'WHERE ' +
  'cm_storage.cluster.id = cm_storage.vserver.cluster_id '+
  'AND cm_storage.vserver.id = cm_storage.cifs_share.vserver_id '+
  'AND cm_storage.volume.vserver_id = cm_storage.vserver.id '+
  'AND cm_storage.cluster.location = ? ' +
  'AND cm_storage.volume.name = ? ';

   console.log('Server getCifsShare: MySQL Read: Query: ' + util.inspect(args, {showHidden: false, depth: null}));

  connectionPool.getConnection(function(err, connection) {
    if(err){
      console.log('Server getCifsShare: MySQL Read: Connection Error: ' + err);
      res(err, cifsShare);
    }else{
      connection.query(args, [location, volumename], function (err, result) {
        console.log('Server getCifsShare: MySQL Read: Result: ' + util.inspect(result, {showHidden: false, depth: null}));
        if (err) {
          console.log('Server getCifsShare: MySQL Read: Error: ' + err);
          res(err, cifsShare);
        } else if (result.length > 0) {
            cifsShare.sharename = result[0].sharename;
            cifsShare.sharepath = result[0].sharepath;
            cifsShare.vservername = result[0].vservername;
            cifsShare.clustername = result[0].clustername;
          
          res(null, cifsShare);
        } else {
          console.log('Server getAdminVserver(): MySQL Read: No Records found');
          res("Server Read: No records found", cifsShare);
        }
        connection.release();
      });
    }
  });
};

exports.getClusterInfo = function (location, volumename, res) {

  console.log('Server getClusterInfo: MySQL Read: Retrieving Admin Vserver for location: \"' + location + '\" and volumename \"' + volumename + '\".');

  var cifsShare = {
    clustername:'',
    vservername:'' 
  };

  var args = ' Select '+
  'cm_storage.cluster.name as clustername, cm_storage.vserver.name vservername '+
  'FROM ' +
  'cm_storage.vserver, ' +
  'cm_storage.cluster,' +
  'cm_storage.volume ' + 
  'WHERE ' +
  'cm_storage.cluster.id = cm_storage.vserver.cluster_id '+
  'AND cm_storage.volume.vserver_id = cm_storage.vserver.id '+
  'AND cm_storage.cluster.location = ? ' +
  'AND cm_storage.volume.name = ? ';

   console.log('Server getClusterInfo: MySQL Read: Query: ' + util.inspect(args, {showHidden: false, depth: null}));

  connectionPool.getConnection(function(err, connection) {
    if(err){
      console.log('Server getClusterInfo: MySQL Read: Connection Error: ' + err);
      res(err, cifsShare);
    }else{
      connection.query(args, [location, volumename], function (err, result) {
        console.log('Server getClusterInfo: MySQL Read: Result: ' + util.inspect(result, {showHidden: false, depth: null}));
        if (err) {
          console.log('Server getClusterInfo: MySQL Read: Error: ' + err);
          res(err, cifsShare);
        } else if (result.length > 0) {
            cifsShare.vservername = result[0].vservername;
            cifsShare.clustername = result[0].clustername;
          
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

// exports.svmRead = function (req, res) {

//   var svmOut = {
//     volumesName: '',
//     volumesUsed: '',
//     volumesCapacity: '',
//     volumesTier: '',
//     iopsTotal: ''
//   };

//   var args = 'SELECT ' +
//       'cluster.primary_address AS cluster_primary_address, ' +
//       'vserver.name AS name, ' +
//       'GROUP_CONCAT(volume.name) AS volumes_name, ' +
//       'GROUP_CONCAT(volume.used_size_mb) AS volumes_used, ' +
//       'GROUP_CONCAT(volume.size_mb) AS volumes_size, ' +
//       'GROUP_CONCAT(aggregate.name) AS volumes_aggregate, ' +
//       '( ' +
//         'SELECT ' +
//           'GROUP_CONCAT(qos_policy_group.max_throughput_limit) ' +
//         'FROM ' +
//           'cm_storage.qos_policy_group qos_policy_group ' +
//         'WHERE ' +
//           'qos_policy_group.vserver_id = vserver.id ' +
//         'GROUP BY ' +
//           'vserver.id ' +
//       ') AS qos_policy_groups_max_throughput_limit ' +
//     'FROM ' +
//       'cm_storage.vserver vserver ' +
//       'JOIN ' +
//         'cm_storage.cluster cluster ' +
//           'ON vserver.cluster_id = cluster.id ' +
//       'JOIN ' +
//         'cm_storage.volume volume ' +
//           'ON volume.vserver_id = vserver.id ' +
//       'JOIN ' +
//         'cm_storage.aggregate aggregate ' +
//           'ON volume.aggregate_id = aggregate.id ' +
//     'WHERE ' +
//       'volume.name NOT LIKE CONCAT(vserver.name,"_root") ' +
//       'AND vserver.name LIKE ? ' +
//     'GROUP BY ' +
//       'vserver.id';

//   logger.info('Server svmRead(): MySQL Read: Query: ' + util.inspect(args, {showHidden: false, depth: null}));

//   connectionPool.getConnection(function(err, connection) {
//     if(err){
//       logger.error('Server svmRead(): MySQL Read: Connection Error: ' + err);
//       //On error send empty output
//       res(null, svmOut);
//     }else{
//       connection.query( args, [req], function(err, result) {
//         if (err) {
//           logger.info('Server svmRead(): MySQL Read: Error: ' + err);
//         } else if (result.length > 0) {
//           svmOut.volumesName = result[0].volumes_name;
//           svmOut.volumesUsed = result[0].volumes_used;
//           svmOut.volumesCapacity = result[0].volumes_size;
//           svmOut.volumesTier = result[0].volumes_aggregate;
//           svmOut.iopsTotal = result[0].qos_policy_groups_max_throughput_limit;
//         }
//         res(null, svmOut);
//         connection.release();
//       });
//     }
//   });
// };

exports.getUUIDs = function(serverCode, clusterName, res) {
  logger.error('Server getUUIDs: MySQL Read: Retrieving Admin Vserver for vserver_uuid, cluster_uuid, storage_vm_key: \"' + serverCode + '\" and subscriptionCode \"' + clusterName + '\".');

  var adminVserver = {
    ontap_cluster_uuid : '',
    ontap_vserver_uuid : '',
    apis_storage_vm_key  : ''
  };


  var args = ' SELECT ' +
    'vserver.uuid as "vserver_uuid", ' +
    'cluster.uuid as "cluster_uuid", ' +
    'concat(cluster.uuid,":type=vserver,uuid=",vserver.uuid) as "storage_vm_key" ' +
    'FROM vserver , cluster ' +
    'WHERE ' +
        'vserver.cluster_id = cluster.id ' +
        'AND vserver.name = ? ' +       
        'AND ( ' + 
        ' cluster.primary_address = ? or  cluster.name = ?)';

  logger.info('Server getUUIDs(): MySQL Read: Query: ' + util.inspect(args, {showHidden: false, depth: null}));
  logger.info("query params for sql:");
  logger.info( [serverCode, clusterName, clusterName]);

  connectionPool.getConnection(function(err, connection) {
    if(err){
      logger.error('Server getUUIDs(): MySQL Read: Connection Error: ' + err);
      res(err, adminVserver);
    }else{
      connection.query(args, [serverCode, clusterName, clusterName], function (err, result) {
        logger.info("sql query = " + this.sql);
        logger.info('Server getUUIDs(): MySQL Read: Result: ' + util.inspect(result, {showHidden: false, depth: null}));
        if (err) {
          logger.info('Server getUUIDs(): MySQL Read: Error: ' + err);
          res(err, adminVserver);
        } else if (result.length > 0) {
          adminVserver.ontap_cluster_uuid = result[0].cluster_uuid;
          adminVserver.ontap_vserver_uuid = result[0].vserver_uuid;
          adminVserver.apis_storage_vm_key = result[0].storage_vm_key;
          res(null, adminVserver);
        } else {
          res(null, false);
        }
        connection.release();
      });
    }
  });
}
