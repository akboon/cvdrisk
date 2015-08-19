var getHomePath = require('home-path');
var fse = require('fs-extra');
var fs = require('fs');
var path = require('path');

var homePath = getHomePath();

// Check configure path exists
var configPath = path.join(homePath, 'cvdrisk');
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
  }
};

fs.access(configFile, fs.W_OK, function (err) {
  if (err) {
    fse.writeJsonSync(configFile, defaultConfig);
  }
});
