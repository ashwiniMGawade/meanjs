const nodeMailin = require('node-mailin');
var path = require("path"),
util = require('util'),
config = require(path.resolve('./config/config'));
/* Start the Node-Mailin server. The available options are:
 *  options = {
 *     port: 25,
 *     logFile: '/some/local/path',
 *     logLevel: 'warn', // One of silly, info, debug, warn, error
 *     smtpOptions: { // Set of options directly passed to simplesmtp.createServer(smtpOptions)
 *        SMTPBanner: 'Hi from a custom Node-Mailin instance',
 *        // By default, the DNS validation of the sender and recipient domains is disabled so.
 *        // You can enable it as follows:
 *        disableDNSValidation: false
 *     }
 *  };
 * parsed message. */
nodeMailin.start({
  port: 25,
  host: config.mailer.options.service
});
/* Access simplesmtp server instance. */
nodeMailin.on('authorizeUser', function(connection, username, password, done) {
  if (username == "johnsmith" && password == "mysecret") {
    done(null, true);
  } else {
    done(new Error("Unauthorized!"), false);
  }
});
/* Event emitted when a connection with the Node-Mailin smtp server is initiated. */
nodeMailin.on('startMessage', function (connection) {
  /* connection = {
      from: 'sender@somedomain.com',
      to: 'someaddress@yourdomain.com',
      id: 't84h5ugf',
      authentication: { username: null, authenticated: false, status: 'NORMAL' }
    }
  }; */
  console.log("connection initiated");
  console.log(connection);
});
/* Event emitted after a message was received and parsed. */
nodeMailin.on('message', function (connection, data, content) {
  console.log(data);
  /* Do something useful with the parsed message here.
   * Use parsed message `data` directly or use raw message `content`. */
});