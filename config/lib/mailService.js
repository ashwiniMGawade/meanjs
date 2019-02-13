var nodemailer = require('nodemailer'),
    smtpTransport = require("nodemailer-smtp-transport"),
    path = require("path"),
    config = require(path.resolve('./config/config'));

var transporter = nodemailer.createTransport(
    smtpTransport({
        host : config.mailer.options.service,
        port: 25,
        auth :config.mailer.options.auth
    })

    //for local
    // {
    //     service: config.mailer.options.service,
    //     auth :config.mailer.options.auth
    // }

);

function getEmailTemplate(emailParams) {
    var htmlBody = '<pre><div style="font-size:15px;font-family:arial;color:#222;">'+
                   '<h3 style="color:#222;">'+ emailParams.notification.category + ' & Notification:</h3>' +
                    '<h5>Summary: ' + emailParams.notification.summary + '</h5>'+
                     '<p style="color:#222;">' + emailParams.notification.message + '</p>'+
                     '</p>' +
                     '<p style="color:#222;">Start date and time: '+ emailParams.notification.start + '</p>' +
                     '<p style="color:#222;">End date and time: '+ emailParams.notification.end + '</p>' +
                     '</div></pre>'+  featuresSettings.labels.app.emailFooter  +                  
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
  
    return email;
  }

exports.sendEmail = function (email) {

    var mailOptions = {
      from: email.from, // sender address
      to:  email.to,   // list of receivers
      subject: email.subject, // Subject line
      html: email.htmlBody, // html body
      bcc:email.bcc
    };

    // send mail with defined transport object
    transporter.sendMail(mailOptions, function(error, info){
      if(error){
          transporter.close();
          return console.log(error);
      }
      console.log('Email sent to ' + mailOptions.to);
      transporter.close();
    });
    
};