var passport = require('passport');
var WindowsStrategy = require('passport-windowsauth');

passport.use(new WindowsStrategy({
  ldap: {
    url:             config.ldap.url,
    base:            config.ldap.searchBase,
    bindDN:          config.ldap.bindDN,
    bindCredentials: config.ldap.bindCredentials
  },
  getUserNameFromHeader: function (req) {
    //in the above apache config we set the x-forwarded-user header.
    //mod_auth_kerb uses user@domain
    console.log(req.headers);
    return req.headers['x-forwarded-user'].split('@')[0];
  }
}, function(profile, done){
    console.log(profile);
//   User.findOrCreate({ waId: profile.id }, function (err, user) {
//     done(err, user);
//   });
}));