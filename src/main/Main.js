var fse = require('fs-extra');
var Q = require('q');
var _ = require('lodash');

$(function () {
  var configFile = sysGetConfigFile();
  var config = fse.readJsonSync(configFile);
  //
  var db = require('knex')({
    client: 'mysql',
    connection: config.db,
    charset: 'utf8'
  });
  //
  var Main = {
    _getService: function (date) {
      var q = Q.defer();

      db('ovst as o')
        .select('o.vstdate', 'p.cid', 'o.hn', 'o.vsttime', 'o.vn', db.raw('concat(p.pname,p.fname, " ",p.lname) as ptname'),
        't.name as pttype_name', 'o.pttypeno', 'd.name as doctor_name', 'i.name as pdx_name',
        's.name as spclty_name', 'st.name as ost_name', 'v.income', db.raw('YEAR(o.vstdate)-YEAR(p.birthday) as age'),
        db.raw('concat(v.main_pdx, "-", i.name) as dx'))
        .leftJoin('vn_stat as v', 'v.vn', 'o.vn')
        .innerJoin('patient as p', 'p.hn', 'o.hn')
        .leftJoin('pttype as t', 't.pttype', 'o.pttype')
        .leftJoin('doctor as d', 'd.code', 'o.doctor')
        .leftJoin('icd101 as i', 'i.code', 'v.main_pdx')
        .leftJoin('spclty as s', 's.spclty', 'o.spclty')
        .leftJoin('ovstost as st', 'st.ovstost', 'o.ovstost')
        .where('o.vstdate', date)
        .where('o.pt_subtype', 1)
        .orderBy('o.vn')
        .then(function (rows) {
          q.resolve(rows);
        })
        .catch(function (err) {
          q.reject(err);
        });

      return q.promise;

    }
  }; // End Main{};

  // Get service
  Main._getService('2014-01-01')
  .then(function (rows) {

    var $tbl = $('#tblVisit > tbody');
    $('#tblVisit').DataTable({
      data: rows,
      columns: [
        { data: 'hn', title: 'HN' },
        { data: 'ptname', title: 'ชื่อ-สกุล'},
        { data: 'age', title: 'อายุ (ปี)'},
        { data: 'dx', title: 'การวินิจฉัย' }
      ],
      "columnDefs": [ {
            "targets": 4,
            "data": null,
            "defaultContent": '<button class="button small-button warning"><span class="mif mif-search"></span></button>'
        } ],
      "order": [[ 1, "desc" ]],
      language: {
        searchPlaceholder: "คำที่ต้องการค้นหา...",
        search: "ค้นหา",
        "paginate": {
          "next": "&gt;",
          "previous": "&lt"
        },
        "emptyTable": "ไม่พบข้อมูล",
        "info": "แสดงหน้า _PAGE_ จาก _PAGES_",
        "loadingRecords": "กรุณารอซักครู่...",
        "lengthMenu": "แสดง _MENU_ เรคอร์ด"
      }
    });

  }, function (err) {
    console.log(err);
  });

  $('#tblVisit').on('click', 'button', function (e) {
    var table = $('#tblVisit').DataTable();
    var data = table.row( $(this).parents('tr') ).data();
    window.location.href = "../detail/Detail.html?hn="+ data.hn + "&vn=" + data.vn;
  });

});
