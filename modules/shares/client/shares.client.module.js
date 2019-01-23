(function (app) {
    'use strict';
  
    app.registerModule('shares');
    app.registerModule('shares.routes', ['ui.router', 'core.routes', 'shares.services']);
    app.registerModule('shares.services');
  }(ApplicationConfiguration));
  