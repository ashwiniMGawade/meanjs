var path = require("path"),
config = require(path.resolve('./config/config')),
_ = require('lodash')
mailService = require(path.resolve('./config/lib/mailService'));

function getEmailTemplate(emailParams) {
    var htmlBody = '<pre><div style="font-size:15px;font-family:arial;color:#222;">'+
                   '<h3 style="color:#222;">'+ emailParams.share.category + ' & Notification:</h3>' +
                    '<h5>Summary: ' + emailParams.share.category + '</h5>'+
                     '<p style="color:#222;">' + emailParams.share.user.displayName + ' created request on </p>'+
                     '</p>' +
                     '<p style="color:#222;">Start date and time: '+ emailParams.share.created + '</p>' +
                     //'<p style="color:#222;">End date and time: '+ emailParams.notification.end + '</p>' +
                     '</div></pre>'+
                     //  featuresSettings.labels.app.emailFooter  +                  
                     '<div style="margin-top:10px;"><span style="color:#222;"><i style="font-size:9px;font-family:sans-serif"><b>Disclaimer</b>'+
                     '<br/>This is an automated email. Please do not reply.'+ 
                     'This communication may contain confidential and privileged material for the sole use of the intended recipient.'+
                     'Any unauthorised review, use or distribution by others is strictly prohibited.'+
                     'If you have received the message by mistake, please delete the message. Thank you.</i><div?';
  
    var email = {
      from: '"Virtual Storage" <noreply@netapp.com>', // sender address
      to: emailParams.email, // list of receivers
      subject: 'Virtual Storage Service Notification', // Subject line
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