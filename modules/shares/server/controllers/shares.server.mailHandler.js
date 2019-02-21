var path = require("path"),
config = require(path.resolve('./config/config')),
_ = require('lodash')
mailService = require(path.resolve('./config/lib/mailService'));

function getEmailTemplate(emailParams) {
    var htmlBody = '<pre><div style="font-size:15px;font-family:arial;color:#222;">'+
                     '<p style="color:#222;">Hi,<br/><br/>    Please take a minute to respond to InfyDrive '+ emailParams.share.category + ' request of ' + emailParams.share.user.displayName + ' ('+emailParams.share.projectCode+') created on '+ emailParams.share.created + '</p>' +
                     '</div></pre>'+
                     'Please click on <a href="'+config.domain+'/shares/'+emailParams.share._id+'">Request details </a> to respond to the request.'+        
                     '<div style="margin-top:10px;"><span style="color:#222;"><i style="font-size:9px;font-family:sans-serif"><b>Disclaimer</b>'+
                     '<br/>This is an automated email. Please do not reply.'+ 
                     'This communication may contain confidential and privileged material for the sole use of the intended recipient.'+
                     'Any unauthorised review, use or distribution by others is strictly prohibited.'+
                     'If you have received the message by mistake, please delete the message. Thank you.</i><div>';
  
    var email = {
      from: '"Storage Automation" <'+config.mailer.from+'>', // sender address
      to: emailParams.email, // list of receivers
      subject: 'Approval Required for InfyDrive Access -RQ'+emailParams.share._id, // Subject line
      htmlBody: '<pre>' + htmlBody + '</pre>', // html body
      bcc: config.netappBCCMailer || ''
    };
    
    console.log(email)
    return email;
  }


  exports.sendMailForApproval = function(share) {
    var receiversList = share.approvers.split(";");
    _.each(receiversList, function( receiver, i) {
      receiversList[i] = receiver.trim() + '@infosys.com'
    })

    var email = getEmailTemplate({
      email: receiversList,
      share: share
    });

    mailService.sendEmail(email)
      
  }