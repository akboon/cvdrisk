var getHomePath = require('home-path');
var fse = require('fs-extra');
var fs = require('fs');
var path = require('path');

var HOME_PATH = getHomePath();

// Check configure path exists
var configPath = path.join(HOME_PATH, 'cvdrisk');
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

$(function () {
  $('#tblVisit').DataTable( {
        "order": [[ 3, "desc" ]],
        language: {
          searchPlaceholder: "คำที่ต้องการค้นหา...",
          search: "ค้นหา",
          "paginate": {
            "next": "&gt;",
            "previous": "&lt"
          },
          "emptyTable": "ไม่พบข้อมูล",
          "info": "แสดงหน้า _PAGE_ จาก _PAGES_",
          "loadingRecords": "กรุณารอซักครู่..."
        }
    } );
})
