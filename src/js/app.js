//var getHomePath = require('home-path');
var fse = require('fs-extra');
var fs = require('fs');
var path = require('path');

// Load native UI library
var ngui = require('nw.gui');

// Get the current window
var nwin = ngui.Window.get();
var homePath = ngui.App.dataPath;
console.log(homePath);

onload = function() {
    nwin.show();
    nwin.maximize();
};

//var homePath = getHomePath();

// Check configure path exists
var configPath = path.join(homePath, 'config');
fse.ensureDirSync(configPath);

// Check configure file exists
var configFile = path.join(configPath, 'config.json');
// Create default config
var defaultConfig = {
  db: {
    host: 'localhost',
    port: 3306,
    database: 'hosxp_pcu',
    user: 'sa',
    password: 'sa'
  },
  cloud: {
    uploadUrl: 'http://kpi.mhkdc.com/upload'
  }
};

fs.access(configFile, fs.W_OK, function (err) {
  if (err) {
    fse.writeJsonSync(configFile, defaultConfig);
  }
});
