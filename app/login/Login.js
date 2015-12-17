$(function () {
			
	var configFile = sysGetConfigFile();
  	var config = fse.readJsonSync(configFile);

	var db = require('knex')({
		client: 'mysql',
		connection: config.db,
		character_set_results: 'tis620',
		charset: 'utf8'
	});
	
  var form = $(".login-form");

  form.css({
    opacity: 1,
    "-webkit-transform": "scale(1)",
    "transform": "scale(1)",
    "-webkit-transition": ".5s",
    "transition": ".5s"
  });

  $('#btnLogin').on('click', function (e) {
    e.preventDefault();

    var username = $('#txtUsername').val();
    var password = $('#txtPassword').val();

	
	if (username == 'admin' && password == 'admin') {
		  window.location.href = "../main/Main.html";
		
	}
	else {
		  $.Notify({
			caption: 'เกิดข้อผิดพลาด',
			content: 'ข้อมูลผู้ใช้งานไม่ถูกต้อง กรุณาตรวจสอบ',
			type: 'alert',
			icon: "<span class='mif-notification'></span>"
		  });
	}
  });
  
  $('#btnClose').on('click', function (e) {
    e.preventDefault();
      window.location.href = "../config/Config.html";
  });

});