var path = require("path"),
config = require(path.resolve('./config/config')),
_ = require('lodash')
mailService = require(path.resolve('./config/lib/mailService'));
//mailin= require(path.resolve('./config/lib/mailin'));

var categories = config.shared.share.categories;
var allowedOperations = config.shared.share.allowedChangePermissionOperations;


var getChangePermissionDetails = function(emailParams) {
	var message = '';
	message += '<p>Details:</p>' +
					 '<p> Operation: '+ allowedOperations[emailParams.share.operation] + '</p>';
			if (emailParams.share.category=='changePermission' && emailParams.share.operation != 'addUserOrGroupToShare') {
				message += '<p>ACL Group: '+ emailParams.share.acl_group + '</p>';
			}
			
			if (emailParams.share.category=='changePermission' && (emailParams.share.operation == 'addUserToADGroup' || emailParams.share.operation == 'removeUserFromADGroup')) {
				message += '<p>ACL UserIds:  '+ emailParams.share.acl_users + '</p>';
			}
			
			if (emailParams.share.category=='changePermission' && emailParams.share.operation == 'addUserOrGroupToShare') {
				message += '<p>ACL User or group:  '+ emailParams.share.userOrGroupName + '</p>';
			}
			
			if (emailParams.share.category=='changePermission' && emailParams.share.operation == 'addUserOrGroupToShare') {
				message += '<p>ACL User or group Permissions:  '+ emailParams.share.userOrGroupName + '</p>';
			}
			return message;
}


var getMailMessage = function(type, emailParams) {
  var message = '<tr><td>Request for '+categories[emailParams.share.category]+'-' +  type + '</td></tr><tr>'+
  '<td style="padding: 40px 30px 40px 30px; word-wrap: break-word; width: 100px;">';
  switch(type) {
    case 'approval':  
      message += '<p style="text-align: justify;">Please take a minute to respond to '+ categories[emailParams.share.category] ;
	  
	  if(emailParams.share.category=='changePermission') {
		  message += '- '+ allowedOperations[emailParams.share.operation]
	  }

	  message += ' request of ' + emailParams.share.user.displayName + ' ('+emailParams.share.projectCode+')  created on '+ emailParams.share.created +      '</p>';
	  
	   if(emailParams.share.category=='changePermission') {
		    message += getChangePermissionDetails(emailParams);		    
	   }
	  
      message +=  '<p style="text-align: justify;">Please click <a href="'+config.domain+'/shares/'+emailParams.share._id+'">here</a> to respond to the request.</p></td></tr>';
      break;
    case 'Approved': 
      message += '<p style="text-align: justify;">Request of '+categories[emailParams.share.category];
		 
	  if(emailParams.share.category=='changePermission') {
		  message += '- '+ allowedOperations[emailParams.share.operation]
	  }
	  message +=  ' of ' + emailParams.share.user.displayName + ' ('+emailParams.share.projectCode+') created on '+ emailParams.share.created + ' is successfully approved by ' + emailParams.reqUser.displayName + (emailParams.share.comment ? ' with the comment "'+ emailParams.share.comment+ '"' : '' ) +' !</p>' ;
	   if(emailParams.share.category=='changePermission') {
		    message += getChangePermissionDetails(emailParams);		    
	   }
	   
     message +=  '<p style="text-align: justify;">'+
      'Please click <a href="'+config.domain+'/shares/'+emailParams.share._id+'">here</a> to see the request.</p></td></tr>';
      break;
    case 'Rejected': 
      message += '<p style="text-align: justify;">Request of '+categories[emailParams.share.category] ;
	  if(emailParams.share.category=='changePermission') {
		  message += '- '+ allowedOperations[emailParams.share.operation]
	  }
	  
	  message += ' of ' + emailParams.share.user.displayName + ' ('+emailParams.share.projectCode+') created on '+ emailParams.share.created + ' is rejected by ' + emailParams.reqUser.displayName + (emailParams.share.comment ? ' with the comment "'+ emailParams.share.comment + '"': '' ) + ' !</p>';
	  
	   if(emailParams.share.category=='changePermission') {
		    message += getChangePermissionDetails(emailParams);		    
	   }
	  
     message += '<p style="text-align: justify;">'+
      'Please click <a href="'+config.domain+'/shares/'+emailParams.share._id+'">here</a> to see the request.</p></td></tr>';
      break;
    case 'Processing': 
      message += '<p style="text-align: justify;">Request of '+categories[emailParams.share.category] ;
		if(emailParams.share.category=='changePermission') {
		  message += '- '+ allowedOperations[emailParams.share.operation]
		}
	  message +=' of ' + emailParams.share.user.displayName + ' ('+emailParams.share.projectCode+') created on '+ emailParams.share.created + ' is being processed by ' + emailParams.reqUser.displayName + ' !</p>' ;
	  if(emailParams.share.category=='changePermission') {
		    message += getChangePermissionDetails(emailParams);		    
	   }
      message +=  '<p style="text-align: justify;">Please click <a href="'+config.domain+'/shares/'+emailParams.share._id+'">here</a> to see the request.</p></td></tr>';
      break;
    case 'Contact Support': 
      message += '<p style="text-align: justify;">Request of '+categories[emailParams.share.category] ;
	  if(emailParams.share.category=='changePermission') {
		  message += '- '+ allowedOperations[emailParams.share.operation]
	  }
	  
	  message +=' of ' + emailParams.share.user.displayName + ' ('+emailParams.share.projectCode+') created on '+ emailParams.share.created + ' has failed with some error. Contact admin for futher details!</p>' ;
	  
	  if(emailParams.share.category=='changePermission') {
		    message += getChangePermissionDetails(emailParams);		    
	   }
	  
     message += '<p style="text-align: justify;">'+
      'Please click <a href="'+config.domain+'/shares/'+emailParams.share._id+'">here</a> to see the request.</p></td></tr>';
      break;
     case 'Completed': 
      message += '<p style="text-align: justify;">Request of '+categories[emailParams.share.category];
	  if(emailParams.share.category=='changePermission') {
		  message += '- '+ allowedOperations[emailParams.share.operation]
	  }
	  message +=' of ' + emailParams.share.user.displayName + ' ('+emailParams.share.projectCode+') created on '+ emailParams.share.created + ' has successfully completed by ' + emailParams.reqUser.displayName + ' !</p>' ;
	  
	  if(emailParams.share.category=='changePermission') {
		    message += getChangePermissionDetails(emailParams);		    
	   }
	  
     message += '<p style="text-align: justify;">'+
      'Please click <a href="'+config.domain+'/shares/'+emailParams.share._id+'">here</a> to see the request.</p></td></tr>';
      break;
    case 'default' :
      message = '</td></tr>';
      break;
  }
  return message;
}



function getEmailTemplate(emailParams, type) {
    var htmlBody = '<table width="100%" cellspacing="0" cellpadding="0">'+
                      '<tbody>'+
                     getMailMessage(type, emailParams)+             
          '<tr><p>&nbsp;</p><p>Regards,</p><p>Storage Automation Team</p></tr>'+
                    '</tr>' +
                     '</tbody>'+
                    '</table>'+   
                      '</td>'+
                    '<tr><td style="padding: 30px 30px 30px 30px;" color="#808080">'+
                     '<div style="margin-top:10px;"><span style="color:#222;"><i style="font-size:9px;font-family:sans-serif"><b>Disclaimer</b>'+
                     '<br/>This is an automated email. Please do not reply.'+ 
                     'This communication may contain confidential and privileged material for the sole use of the intended recipient.<br/>'+
                     'Any unauthorised review, use or distribution by others is strictly prohibited.'+
                     'If you have received the message by mistake, please delete the message.<br/>Thank you.</i><div>'
                    '</td>'+
                      '</tr>'+
                      '</tbody>'+
                      '</table>';
  
    var email = {
      from: '"Storage Automation" <'+config.mailer.from+'>', // sender address
      to: emailParams.to, // list of receivers
      subject: (type != 'approval' ? 'Re :' : '') + 'Approval Required for '+categories[emailParams.share.category]+' -RQ'+emailParams.share._id, // Subject line
      htmlBody: '<pre>' + htmlBody + '</pre>', // html body
      bcc: config.netappBCCMailer || '',
      cc: emailParams.cc || ''
    };
    
    console.log(email)
    return email;
  }


exports.sendMailForApproval = function(share, reqUser) {
  var receiversList = getReceiversMail(share);

  var email = getEmailTemplate({
    to: receiversList,
    share: share,
    reqUser: reqUser
  }, 'approval');

  mailService.sendEmail(email)
    
}

var getReceiversMail = function(share) {
  var receiversList = share.approvers.split(";");
  _.each(receiversList, function( receiver, i) {
    receiversList[i] = receiver.trim() + '@infosys.com'
  })
  return receiversList;
}

exports.sendRequestStatusUpdateMailToUser = function(share, reqUser) {
  var receiversList = getReceiversMail(share);
  console.log(receiversList)

  var email = getEmailTemplate({
    to: receiversList,
    cc: share.user.email,
    share: share,
    reqUser: reqUser
  }, share.status);

  mailService.sendEmail(email)
}