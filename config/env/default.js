'use strict';
var constants = require('constants');

module.exports = {
  app: {
    title: 'MEAN.JS',
    description: 'Full-Stack JavaScript with MongoDB, Express, AngularJS, and Node.js',
    keywords: 'mongodb, express, angularjs, node.js, mongoose, passport',
    googleAnalyticsTrackingID: process.env.GOOGLE_ANALYTICS_TRACKING_ID || 'GOOGLE_ANALYTICS_TRACKING_ID'
  },
  db: {
    promise: global.Promise
  },
  sql: {
    authType: process.env.SQL_AUTH_TYPE,
    username: process.env.SQL_USER,
    password: process.env.SQL_USER_PASSWORD,
    server: process.env.SQL_SERVER,
    db: process.env.SQL_DB,
    domain: process.env.SQL_DOMAIN
  },
 ldap: {
    url: process.env.LDAP_URL,
    bindDN:process.env.LDAP_BIND_DN,
    bindCredentials:process.env.LDAP_BIND_CREDENTIALS,
    searchBase:process.env.LDAP_SEARCH_BASE
  },
  wfa: {
    authorization:process.env.WFA_SERVER_AUTHORIZATION,
    sql: {
      connectionLimit : 5,
      host: process.env.WFA_SERVER_HOST,
      user: process.env.WFA_SERVER_MYSQL_USERNAME,
      password: process.env.WFA_SERVER_MYSQL_PASSWORD 
      // database: process.env.WFA_SERVER_MYSQL_DATABASE 
    },
    httpsClientOptions: {
      connection: {
          secureOptions: constants.SSL_OP_NO_SSLv2|constants.SSL_OP_NO_SSLv3|constants.SSL_OP_NO_TLSv1, // Disable SSL2/SSL3/TLS1.
          ciphers: constants.defaultCoreCipherList + ':EDH-RSA-DES-CBC3-SHA:DES-CBC3-SHA', // Add two ciphers for WFA 4.0.
          rejectUnauthorized: false, // Accept self-signed certs.
          honorCipherOrder: true
      }
    },
    workflows: {
      'newShare': 'https://'+process.env.WFA_SERVER_HOST+'/rest/workflows/7d394429-b44d-41bb-9ba5-901ce5264b99/jobs',
      'changePermission':'https://'+process.env.WFA_SERVER_HOST+'/rest/workflows/c47814db-35c9-423b-977e-1f35e365f005/jobs',
      'resize':'https://'+process.env.WFA_SERVER_HOST+'/rest/workflows/c47814db-35c9-423b-977e-1f35e365f005/jobs',
      'rename':'https://'+process.env.WFA_SERVER_HOST+'/rest/workflows/c47814db-35c9-423b-977e-1f35e365f005/jobs',
      'restoreProjectShare':'https://'+process.env.WFA_SERVER_HOST+'/rest/workflows/c47814db-35c9-423b-977e-1f35e365f005/jobs',
      'retireVolumeWorkflow':'https://'+process.env.WFA_SERVER_HOST+'/rest/workflows/c47814db-35c9-423b-977e-1f35e365f005/jobs',
      'migration': 'https://'+process.env.WFA_SERVER_HOST+'/rest/workflows/c47814db-35c9-423b-977e-1f35e365f005/jobs'
    }
  },
  port: process.env.PORT || 3000,
  host: process.env.HOST || '0.0.0.0',
  // DOMAIN config should be set to the fully qualified application accessible
  // URL. For example: https://www.myapp.com (including port if required).
  domain: process.env.DOMAIN || "http://localhost:3000",
  // Session Cookie settings
  sessionCookie: {
    // session expiration is set by default to 24 hours
    maxAge: 24 * (60 * 60 * 1000),
    // httpOnly flag makes sure the cookie is only accessed
    // through the HTTP protocol and not JS/browser
    httpOnly: true,
    // secure cookie should be turned to true to provide additional
    // layer of security so that the cookie is set only when working
    // in HTTPS mode.
    secure: false
  },
  // sessionSecret should be changed for security measures and concerns
  sessionSecret: process.env.SESSION_SECRET || 'MEAN',
  // sessionKey is the cookie session name
  sessionKey: 'sessionId',
  sessionCollection: 'sessions',
  // Lusca config
  csrf: {
    csrf: false,
    csp: false,
    xframe: 'SAMEORIGIN',
    p3p: 'ABCDEF',
    xssProtection: true
  },
  logo: 'modules/core/client/img/brand/logo.png',
  favicon: 'modules/core/client/img/brand/favicon.ico',
  illegalUsernames: ['meanjs', 'administrator', 'password', 'admin', 'user',
    'unknown', 'anonymous', 'null', 'undefined', 'api'
  ],
  aws: {
    s3: {
      accessKeyId: process.env.S3_ACCESS_KEY_ID,
      secretAccessKey: process.env.S3_SECRET_ACCESS_KEY,
      bucket: process.env.S3_BUCKET
    }
  },
  uploads: {
    // Storage can be 'local' or 's3'
    storage: process.env.UPLOADS_STORAGE || 'local',
    profile: {
      image: {
        dest: './modules/users/client/img/profile/uploads/',
        limits: {
          fileSize: 1 * 1024 * 1024 // Max file size in bytes (1 MB)
        }
      }
    }
  },
  shared: {
    owasp: {
      allowPassphrases: true,
      maxLength: 128,
      minLength: 10,
      minPhraseLength: 20,
      minOptionalTestsToPass: 4
    }
  }

};
