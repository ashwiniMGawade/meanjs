'use strict';

var Client = require('node-rest-client').Client,
  path = require('path'),
  util = require('util'),
  config = require(path.resolve('./config/config'));

var client = new Client(config.wfa.httpsClientOptions);

exports.executeWfaWorkflow = function (req, res) {

  var args = getWorkflowArgs(req)

  //console.log('share WFA Create: Args : ' + util.inspect(args, {showHidden: false, depth: null}));
  console.log("executing job", config.wfa.workflows[req.share.category]);
  var shareCreateReq = client.post(config.wfa.workflows[req.share.category], args, function (data, response) {

    if (Buffer.isBuffer(data)) {
      data = data.toString('utf8');
    }

    console.log(response)

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

  switch(req.share.category) {
    case 'newShare': 
      args.data = '<workflowInput>' +
        '<userInputValues>' +
        '<userInputEntry value="' + (req.clusterNamw || '') + '" key="ClusterName"/>' +
        '<userInputEntry value="' + (req.vserverName || '') + '" key="VserverName"/>' +
        '<userInputEntry value="' + (req.volumeName || '') + '" key="VolumeName"/>' +
        '<userInputEntry value="' + (req.shareName || '') + '" key="ShareName"/>' +
        '</userInputValues>' +
        '<comments>DFaaS Engine share Create: ' + req.share._id + ' ' + req.share.user.displayName + '</comments>' +
        '</workflowInput>';
      break;
    case 'default':
      break;
  }

  return args;

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

  var shareCreateStatusReq = client.get(config.wfa.shareCreateJob + '/${jobId}', args, function (data) {
    var shareOut;

    if (Buffer.isBuffer(data)) {
      data = data.toString('utf8');
    }

    console.log('share WFA CreateStatus: Received: ' + util.inspect(data, {showHidden: false, depth: null}));
    if (data.job) {
      shareOut = {
        jobStatus: data.job.jobStatus[0].jobStatus[0],
        phase: data.job.jobStatus[0].phase[0]
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

  var shareCreateOutReq = client.get(config.wfa.shareCreateJob + '/${jobId}/plan/out', args, function (data) {
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
