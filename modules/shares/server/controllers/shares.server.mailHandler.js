var path = require("path"),
config = require(path.resolve('./config/config')),
_ = require('lodash')
mailService = require(path.resolve('./config/lib/mailService'));
//mailin= require(path.resolve('./config/lib/mailin'));

var categories = config.shared.share.categories;
var allowedOperations = config.shared.share.allowedChangePermissionOperations;
var allowedPermissions = config.shared.share.allowedPermissions;

var getMessageDetails = function(emailParams) {
	var message = '';
	message += '<br/><div><div class="text-center"><b> &nbsp;Request Details:</b></div><table><tbody>' +        
        '<tr><td><b> Location</b></td><td></td><td>' + emailParams.share.city + '</td></tr>'+
        '<tr><td><b> Business Unit </b></td><td></td><td>' + emailParams.share.bu+ '</td></tr>';


      if(emailParams.share.category=='newShare') {
         message += 
             '<tr><td><b>Read Only(DV) </b></td> <td>&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;</td><td>'+ emailParams.share.readOnly + '</td></tr>'+
             '<tr><td><b>Read And Write(PL) </b></td> <td>&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;</td><td>'+ emailParams.share.readAndWrite + '</td></tr>'+
             '<tr><td><b>Read Write And Modify(CC)</b></td> <td>&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;</td><td>'+ emailParams.share.readWriteAndModify + '</td></tr>'+
             '<tr><td><b>Size </b></td> <td>&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;</td><td>'+ emailParams.share.sizegb + 'GB</td></tr>'+
             '<tr><td><b>Cost</b></td> <td>&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;</td><td>'+ emailParams.share.cost + '$ </td></tr>';
      }

      if(emailParams.share.category=='changePermission') {
  			 message += '<tr><td><b>Operation</b></td><td>'+ allowedOperations[emailParams.share.operation] + '</td></tr>';
  			if (emailParams.share.category=='changePermission' && emailParams.share.operation != 'addUserOrGroupToShare') {
  				message += '<tr><td><b>ACL Group</b></td> <td>&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;</td> <td> '+ emailParams.share.acl_group + '</td></tr>';
  			}
  			
  			if (emailParams.share.category=='changePermission' && (emailParams.share.operation == 'addUserToADGroup' || emailParams.share.operation == 'removeUserFromADGroup')) {
  				message += '<tr><td><b>ACL UserIds</b></td> <td>&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;</td><td>'+ emailParams.share.acl_users + '</td></tr>';
  			}
  			
  			if (emailParams.share.category=='changePermission' && emailParams.share.operation == 'addUserOrGroupToShare') {
  				message += '<tr><td><b>ACL User or group</b></td> <td>&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;</td><td>'+ emailParams.share.userOrGroupName + '</td></tr>';
  			}
  			
  			if (emailParams.share.category=='changePermission' && emailParams.share.operation == 'addUserOrGroupToShare') {
  				message += '<tr><td><b>ACL User or group Permissions </b></td> <td>&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;</td><td>'+ allowedPermissions[emailParams.share.userOrGroupPermissions] + '</td></tr>';
  			}
      }
       if(emailParams.share.category=='resize') {
        message += '<tr><td><b>New size</b></td> <td>&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;</td><td>'+ emailParams.share.newSizegb + 'GB </td></tr>';
       }

      message +=  '</tbody></table></div>';
    
			return message;
}


var getMailMessage = function(type, emailParams) {
  var message = '<tr><td>Request for '+categories[emailParams.share.category]+'-' +  type + '</td></tr><tr>'+
  '<td style="padding: 40px 30px 40px 30px; word-wrap: break-word;">';
  switch(type) {
    case 'approval': 

      message +=  '<div>Please take a minute to respond to '+ categories[emailParams.share.category] + ' request of ' + emailParams.share.user.displayName + ' ('+emailParams.share.projectCode+')  created on '+ emailParams.share.created +      '</div><div>'+
      '<br>Please click <a href="'+config.domain+'/shares/'+emailParams.share._id+'">here</a> to respond to the request.</div>'      
      message += getMessageDetails(emailParams);
      break;
    case 'Approved': 
      message +=  '<p style="text-align: justify;">Request of '+categories[emailParams.share.category] + ' of ' + emailParams.share.user.displayName + ' ('+emailParams.share.projectCode+') created on '+ emailParams.share.created + ' is successfully approved by ' + emailParams.reqUser.displayName + (emailParams.share.comment ? ' with the comment "'+ emailParams.share.comment+ '"' : '' ) +' !</p>';
	  message += getMessageDetails(emailParams);
      break;
    case 'Rejected': 
      message += '<p style="text-align: justify;">Request of '+categories[emailParams.share.category] + ' of ' + emailParams.share.user.displayName + ' ('+emailParams.share.projectCode+') created on '+ emailParams.share.created + ' is rejected by ' + emailParams.reqUser.displayName + (emailParams.share.comment ? ' with the comment "'+ emailParams.share.comment + '"': '' ) + ' !</p>' ;
       message += getMessageDetails(emailParams);
      break;
    case 'Processing': 
      message += '<p style="text-align: justify;">Request of '+categories[emailParams.share.category] + ' of ' + emailParams.share.user.displayName + ' ('+emailParams.share.projectCode+') created on '+ emailParams.share.created + ' is  getting processed  by ' + emailParams.reqUser.displayName+ ' !</p>' ;
		message += getMessageDetails(emailParams);		
      break;
    case 'Contact Support': 
      message += '<p style="text-align: justify;">Request of '+categories[emailParams.share.category] + ' of ' + emailParams.share.user.displayName + ' ('+emailParams.share.projectCode+') created on '+ emailParams.share.created + ' has failed with some error. Contact EMAGStorage@infosys.com for futher details!'+ ' !</p>' ;
	  message += getMessageDetails(emailParams);	
      break;
     case 'Completed': 
      message += '<p style="text-align: justify;">Request of '+categories[emailParams.share.category] + ' of ' + emailParams.share.user.displayName + ' ('+emailParams.share.projectCode+') created on '+ emailParams.share.created + ' has successfully completed by ' + emailParams.reqUser.displayName + ' !'+ ' !</p>' ;
      message += getMessageDetails(emailParams);	
      break;
    case 'default' :
      message = '</td></tr>';
      break;
  }
  return message;
}



function getEmailTemplate(emailParams, type) {
    var htmlBody = '<!–[if mso]><style>table, div {font-family: Calibri !important;}</style><table  width="80%" cellspacing="0" cellpadding="0">'+
                      '<tbody>'+
                     getMailMessage(type, emailParams)+  
                     (type != 'approval' ? '<br/><p style="text-align: justify;">Please click <a href="'+config.domain+'/shares/'+emailParams.share._id+'">here</a> to see the request.</p>' : '' ) + '</td></tr>'+      
                    '<tr><td>Regards,</td></tr>'+
                    '<tr><td>Storage Automation Team</td></tr>'+
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
      subject: (type != 'approval' ? 'Re :' : '') + 'Approval Required for '+categories[emailParams.share.category],// Subject line
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
    to: share.user.email,
    cc: share.status == "Contact Support" ?  receiversList : '',
    share: share,
    reqUser: reqUser
  }, share.status);

  mailService.sendEmail(email)
}