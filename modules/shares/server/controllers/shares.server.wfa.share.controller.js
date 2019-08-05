'use strict';

var Client = require('node-rest-client').Client,
  path = require('path'),
  util = require('util'),
  config = require(path.resolve('./config/config'));

var client = new Client(config.wfa.httpsClientOptions);

exports.executeWfaWorkflow = function (req, res) {

  var args = getWorkflowArgs(req);
  var wfaJobId = getWFAjob(req.share);

  console.log('share WFA Create: Args : ' + util.inspect(args, {showHidden: false, depth: null}));
  console.log("executing job", wfaJobId);
  var shareCreateReq = client.post(wfaJobId, args, function (data, response) {

    if (Buffer.isBuffer(data)) {
      data = data.toString('utf8');
    }

    console.log('share '+req.share.category+' WFA : Data received from WFA: ' + util.inspect(data, {showHidden: false, depth: null}));
    if (data && data.job && data.job.$) {
      res(null, { jobId: data.job.$.jobId });
    } else {
      res('share '+req.share.category+' : No Job ID received');
    }
  });

  shareCreateReq.on('requestTimeout', function (reqWfa) {
    console.log('share '+req.share.category+' : Request has expired - Request: ' + util.inspect(reqWfa, {showHidden: false, depth: null}));
    reqWfa.abort();
    res('share '+req.share.category+' : Request Timeout');
  });

  shareCreateReq.on('responseTimeout', function (resWfa) {
    console.log('share '+req.share.category+' : Response has expired - Response: ' + util.inspect(resWfa, {showHidden: false, depth: null}));
    res('share '+req.share.category+' : Response Timeout');
  });

  shareCreateReq.on('error', function (errWfa) {
    console.log('share '+req.share.category+' : Error - Options: ', errWfa.request.options);
    res('share '+req.share.category+' : Error');
  });
};

var getWorkflowArgs = function(req) {
  var args ={
    headers: { 'Authorization': config.wfa.authorization, 'Content-Type': 'application/xml' },    
    requestConfig: {
      timeout: 60000,
      noDelay: true,
      keepAlive: true,
      keepAliveDelay: 10000
    },
    responseConfig: {
      timeout: 60000
    }
  };

  console.log("get args for category" + req.share.category)

  switch(req.share.category) {
    case 'newShare': 
      args.data = '<workflowInput>' +
        '<userInputValues>' +
        '<userInputEntry value="' + (req.primarycluster || '') + '" key="srcClusterName"/>' +
        '<userInputEntry value="' + (req.primaryvserver || '') + '" key="srcVserverName"/>' +
        '<userInputEntry value="' + (req.volumeName || '') + '" key="srcVolumeName"/>' +
        '<userInputEntry value="' + (req.shareName || '') + '" key="shareName"/>' +
        '<userInputEntry value="' + (req.share.sizegb || '') + '" key="size"/>' +
        '<userInputEntry value="' + (req.shareName + 'created by'+ req.share.user.displayName || '') + '" key="description"/>' +
        '<userInputEntry value="' + (req.cityAbbr || '') + '" key="primaryLocation"/>' +
        '<userInputEntry value="' + (req.share.readWriteAndModify || '') + '" key="ccuser"/>' +
        '<userInputEntry value="' + (req.share.readOnly || '') + '" key="dvuser"/>' +
        '<userInputEntry value="' + (req.share.readAndWrite || '') + '" key="pluser"/>' +
        '<userInputEntry value="' + (req.secondarycluster || '') + '" key="destClusterName"/>' +
        '<userInputEntry value="' + (req.secondaryvserver || '') + '" key="destVserver"/>' +
        '</userInputValues>' +
        '<comments>DFaaS Engine share Create: ' + req.share._id + ' ' + req.share.user.displayName + '</comments>' +
        '</workflowInput>';
      break;
    case 'resize': 
      args.data = '<workflowInput>' +
        '<userInputValues>' +
        '<userInputEntry value="' + (req.primarycluster || '') + '" key="clusterName"/>' +
        '<userInputEntry value="' + (req.primaryvserver || '') + '" key="vserverName"/>' +
        '<userInputEntry value="' + (req.volumeName || '') + '" key="volumeName"/>' +
        '<userInputEntry value="' + (req.shareName || '') + '" key="qtreeName"/>' +
        '<userInputEntry value="' + (req.share.newSizegb || '') + '" key="newSize"/>' +
        '</userInputValues>' +
        '<comments>DFaaS Engine share resize: ' + req.share._id + ' ' + req.share.user.displayName + '</comments>' +
        '</workflowInput>';
      break;
    case 'rename': 
      args.data = '<workflowInput>' +
        '<userInputValues>' +
        '<userInputEntry value="' + (req.primarycluster || '') + '" key="clusterName"/>' +
        '<userInputEntry value="' + (req.primaryvserver || '') + '" key="vserverName"/>' +
        '<userInputEntry value="' + (req.volumeName || '') + '" key="volumeName"/>' +
        '<userInputEntry value="' + (req.shareName || '') + '" key="qtreeName"/>' +
        '<userInputEntry value="' + (req.share.newName || '') + '" key="newName"/>' +
        '</userInputValues>' +
        '<comments>DFaaS Engine share rename: ' + req.share._id + ' ' + req.share.user.displayName + '</comments>' +
        '</workflowInput>';
      break;
    case 'changePermission': 
      args.data = '<workflowInput>' +
        '<userInputValues>' +
        '<userInputEntry value="' + (req.primarycluster || '') + '" key="clusterName"/>' +
        '<userInputEntry value="' + (req.primaryvserver || '') + '" key="vserverName"/>' +
        '<userInputEntry value="' + (req.volumeName || '') + '" key="volumeName"/>' +
        '<userInputEntry value="' + (req.shareName || '') + '" key="shareName"/>' +
        (
          (req.share.acl_group || req.share.userOrGroupName) ? ('<userInputEntry value="' + (req.share.acl_group || req.share.userOrGroupName) + '" key="groupName"/>'): ''
        ) +
        (req.share.userOrGroupPermissions ? ('<userInputEntry value="' + (req.share.userOrGroupPermissions || '') + '" key="permission"/>'): '') 
        +
        (req.share.acl_users ? ('<userInputEntry value="' + (req.share.acl_users || '') + '" key="userName"/>'): '') +
        '</userInputValues>' +
        '<comments>DFaaS Engine share change permission: ' + req.share._id + ' ' + req.share.user.displayName + '</comments>' +
        '</workflowInput>';
      break;
    case 'retireVolumeWorkflow':
      args.data = '<workflowInput>' +
        '<userInputValues>' +
        '<userInputEntry value="' + (req.primarycluster || '') + '" key="clusterName"/>' +
        '<userInputEntry value="' + (req.primaryvserver || '') + '" key="vserverName"/>' +
        '<userInputEntry value="' + (req.volumeName || '') + '" key="volumeName"/>' +
        '<userInputEntry value="' + (req.shareName || '') + '" key="shareName"/>' +       
        '</userInputValues>' +
        '<comments>DFaaS Engine volume retire workflow: ' + req.share._id + ' ' + req.share.user.displayName + '</comments>' +
        '</workflowInput>';
      break;
    case 'default':
      break;
  }

  return args;

}

var getWFAjob = function(share) {
  if (share.category != 'changePermission') {
    return config.wfa.workflows[share.category];
  } else {
    return config.wfa.workflows[share.category][share.operation];
  }
}


exports.wfaJobStatus = function (req, res) {
  
  var args = {
    path:{ 'jobId': req.jobId },
    headers:{ 'Authorization': config.wfa.authorization, 'Content-Type': 'application/xml' },
    requestConfig: {
      timeout: 30000,
      noDelay: true,
      keepAlive: true,
      keepAliveDelay: 10000
    },
    responseConfig: {
      timeout: 30000
    }
  };

  //console.log('share WFA CreateStatus: Args:' + util.inspect(args, {showHidden: false, depth: null}));

  var wfaJobId = getWFAjob(req.share);
  var shareCreateStatusReq = client.get(wfaJobId + '/${jobId}', args, function (data) {
    var shareOut;

    if (Buffer.isBuffer(data)) {
      data = data.toString('utf8');
    }

    console.log('share WFA CreateStatus: Received: ' + util.inspect(data, {showHidden: false, depth: null}));
    if (data.job) {
      shareOut = {
        jobStatus: data.job.jobStatus.jobStatus,
        errorMessage: data.job.jobStatus.errorMessage || null,
        phase: data.job.jobStatus.phase
      };
      res(null, shareOut);
    } else {
      res('share WFA CreateStatus: No Status received');
    }
  });

  shareCreateStatusReq.on('requestTimeout', function (reqWfa) {
    console.log('share WFA CreateStatus: Request has expired - Request: ' + util.inspect(reqWfa, {showHidden: false, depth: null}));
    reqWfa.abort();
    res('share WFA CreateStatus: Request Timeout');
  });

  shareCreateStatusReq.on('responseTimeout', function (resWfa) {
    console.log('share WFA CreateStatus: Response has expired - Response: ' + util.inspect(resWfa, {showHidden: false, depth: null}));
    res('share WFA CreateStatus: Response Timeout');
  });

  shareCreateStatusReq.on('error', function (errWfa) {
    console.log('share WFA CreateStatus: Error - Options ', errWfa.request.options);
    res('share WFA CreateStatus: Error');
  });
};


exports.wfaJobOut = function (req, res) {
  var wfaJobId = getWFAjob(req.share);
  var args = {
    path:{ 'jobId': req.jobId },
    headers:{ 'Authorization': config.wfa.authorization, 'Content-Type': 'application/xml' },
    requestConfig: {
      timeout: 60000,
      noDelay: true,
      keepAlive: true,
      keepAliveDelay: 10000
    },
    responseConfig: {
      timeout: 60000
    }
  };

  //console.log('share WFA CreateOut: Args: ' + util.inspect(args, {showHidden: false, depth: null}));
 
  var shareCreateOutReq = client.get(wfaJobId + '/${jobId}/plan/out', args, function (data) {
    var shareOut;

    if (Buffer.isBuffer(data)) {
      data = data.toString('utf8');
    }
    console.log("job id=" + req.jobId);

    console.log('share WFA CreateOut: Received: ' + util.inspect(data, {showHidden: false, depth: null}));
    if (data.collection) {
      shareOut = {
        ipVirtClus: data.collection.keyAndValuePair[0].$.value,
        ipMgmt: data.collection.keyAndValuePair[1].$.value,
        code: data.collection.keyAndValuePair[2].$.value
      };
      res(null, shareOut);
    } else {
      res('share WFA CreateOut: No Output received');
    }
  });

  shareCreateOutReq.on('requestTimeout', function (reqWfa) {
    console.log('share WFA CreateOut: Request has expired - Request: ' + util.inspect(reqWfa, {showHidden: false, depth: null}));
    reqWfa.abort();
    res('share WFA CreateOut: Request Timeout');
  });

  shareCreateOutReq.on('responseTimeout', function (resWfa) {
    console.log('share WFA CreateOut: Response has expired - Response: ' + util.inspect(resWfa, {showHidden: false, depth: null}));
    res('share WFA CreateOut: Response Timeout');
  });

  shareCreateOutReq.on('error', function (errWfa) {
    console.log('share WFA CreateOut: Error - Options: ', errWfa.request.options);
    res('share WFA CreateOut: Error');
  });
};
