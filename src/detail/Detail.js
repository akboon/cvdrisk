$(function () {

  $('#gfrChart').circliful();
  $('#cvdChart').circliful();

  var Q = require('q');
  var fse = require('fs-extra');
  var moment = require('moment');
  var _ = require('lodash');

  var configFile = sysGetConfigFile();
  var config = fse.readJsonSync(configFile);

  var db = require('knex')({
    client: 'mysql',
    connection: config.db,
    charset: 'utf8'
  });

  // Get url params
  var vn = sysGetUrlParams('vn');
  var hn = sysGetUrlParams('hn');

  var Detail = {
    _getDiagnosis: function (vn) {
      var q = Q.defer();
      var sql = 'select o.vn, concat(o.icd10, " - ", icd.name) as diag, ' +
        ' concat(o.diagtype, " - ", dt.name) as diagtype' +
        ' from ovstdiag as o ' +
        ' left join diagtype as dt on dt.diagtype=o.diagtype ' +
        ' left join icd101 as icd on icd.code=o.icd10 ' +
        ' where o.vn=?';
      db.raw(sql, [vn])
      .then(function (rows) {
        q.resolve(rows[0]);
      })
      .catch(function (err) {
        q.reject(err);
      });

      return q.promise;
    },
    _getProcedure: function (vn) {
      var q = Q.defer();
      var sql = 'select d.vn, d.er_oper_code, d.price, e.name as procedure_name ' +
        ' from doctor_operation as d ' +
        ' left join er_oper_code as e on e.er_oper_code=d.er_oper_code ' +
        ' where d.vn=?';
      db.raw(sql, [vn])
      .then(function (rows) {
        q.resolve(rows[0]);
      })
      .catch(function (err) {
        q.reject(err);
      });

      return q.promise;
    },
    _getCharges: function (vn) {
      var q = Q.defer();
      var sql = 'select o.vn, o.icode, nd.name as income_name, o.qty, ' +
        ' o.unitprice as price , o.qty*o.unitprice as totalPrice ' +
        ' from opitemrece as o  ' +
        ' left join nondrugitems as nd on nd.icode=o.icode ' +
        ' where o.income <> "03" ' +
        ' and o.vn=?';
      db.raw(sql, [vn])
      .then(function (rows) {
        q.resolve(rows[0]);
      })
      .catch(function (err) {
        q.reject(err);
      });

      return q.promise;
    },
    _getDrugs: function (vn) {
      var q = Q.defer();
      var sql = 'select o.vn, o.icode, d.name as drug_name, o.qty, o.unitprice as price,  ' +
        ' o.qty*o.unitprice as totalPrice, ' +
        ' ds.name1, ds.name2, ds.code as usage_code  ' +
        ' from opitemrece as o  ' +
        ' left join drugitems as d on d.icode=o.icode ' +
        ' left join drugusage as ds on ds.drugusage=o.drugusage ' +
        ' where o.income = "03" ' +
        ' and o.vn=?';
      db.raw(sql, [vn])
      .then(function (rows) {
        q.resolve(rows[0]);
      })
      .catch(function (err) {
        q.reject(err);
      });

      return q.promise;
    },
    _getPatientInfo: function (hn) {
      var q = Q.defer();
      var sql = 'select p.cid, p.patient_hn as hn, concat(p.fname, " ", p.lname) as ptname, ' +
        ' p.birthdate, year(current_date())-year(p.birthdate) as age, p.house_regist_type_id, h.house_regist_type_name, ' +
        ' if(p.sex="1", "ชาย", "หญิง") as sex ' +
        ' from person as p ' +
        ' left join house_regist_type as h on h.house_regist_type_id=p.house_regist_type_id ' +
        ' where p.patient_hn=?';
      db.raw(sql, [hn])
      .then(function (rows) {
        q.resolve(rows[0]);
      })
      .catch(function (err) {
        q.reject(err);
      });

      return q.promise;
    },
    _getVisitDetail: function (vn) {
      var q = Q.defer();
      var sql = 'select v.vn, v.hn, v.dx_doctor, d.name as doctor_name,' +
        'v.pttype, v.pttypeno, v.spclty, sp.name as spclty_name, v.vstdate,  ' +
        'pt.name as pttype_name, concat(v.pdx, " - ", icd.name) as diag_name ' +
        'from vn_stat as v  ' +
        'left join pttype as pt on pt.pttype=v.pttype ' +
        'left join doctor as d on d.code=v.dx_doctor ' +
        'left join spclty as sp on sp.spclty=v.spclty ' +
        'left join icd101 as icd on icd.code=v.pdx ' +
        'where v.vn=?';
      db.raw(sql, [vn])
      .then(function (rows) {
        q.resolve(rows[0]);
      })
      .catch(function (err) {
        q.reject(err);
      });

      return q.promise;
    },
    _getLabs: function (vn) {
      var q = Q.defer();
      var sql = 'select lh.vn, lo.lab_items_code, lo.lab_order_result, ' +
        'li.lab_items_name, li.lab_items_unit ' +
        'from lab_order as lo ' +
        'inner join lab_head as lh on lh.lab_order_number=lo.lab_order_number ' +
        'left join lab_items as li on li.lab_items_code=lo.lab_items_code ' +
        'where lh.vn=?';
      db.raw(sql, [vn])
      .then(function (rows) {
        q.resolve(rows[0]);
      })
      .catch(function (err) {
        q.reject(err);
      });

      return q.promise;
    },
    _getChronicClinic: function (hn) {
      var q = Q.defer();
      var sql = 'select group_concat(distinct if(c.clinic="001", "DM", if(c.clinic="002", "HT", null))) as chronic ' +
        'from clinicmember as c ' +
        'where c.hn=?';
      db.raw(sql, [hn])
      .then(function (rows) {
        q.resolve(rows[0]);
      })
      .catch(function (err) {
        q.reject(err);
      });

      return q.promise;
    },
    _getOpdScreenHistory: function (hn, cholesterol) {
      var q = Q.defer();
      var sql = 'select s.vn, s.vstdate, s.bpd, s.bps, concat(s.bps, "/", s.bpd) as bp, s.bw, s.pulse, ' +
          'case sm.nhso_code ' +
          '  when 1 or 9 then "N" ' +
          '  when 2 then "Y" ' +
          '  when 3 then "Y" ' +
          '  when 4 then "Y" ' +
          '  else "N" ' +
          'END as smoking, ' +
          'timestampdiff(year, p.birthdate, s.vstdate) as age_year, ' +
          '(select lo.lab_order_result ' +
          'from lab_order as lo  ' +
          'inner join lab_items as li on li.lab_items_code=lo.lab_items_code ' +
          'inner join lab_head as lh on lo.lab_order_number=lh.lab_order_number ' +
          'where lh.vn=s.vn ' +
          'and lo.lab_items_code=?) as cholesterol ' +
          'from opdscreen as s ' +
          'inner join person as p on p.patient_hn=s.hn ' +
          'left join smoking_type as sm on sm.smoking_type_id=s.smoking_type_id ' +
          'left join drinking_type as dm on dm.drinking_type_id=s.drinking_type_id ' +
          'where s.hn=? ' +
          'order by s.vstdate desc ' +
          'limit 100';
      db.raw(sql, [cholesterol, hn])
      .then(function (rows) {
        q.resolve(rows[0]);
      })
      .catch(function (err) {
        q.reject(err);
      });

      return q.promise;
    }
  };

  Detail._getPatientInfo(hn)
  .then(function (rows) {
    var person = rows[0];
    $('#txtHN').text(person.hn);
    $('#txtCID').text(person.cid);
    $('#txtFullname').text(person.ptname);
    $('#txtAge').text(person.age);
    $('#txtSex').text(person.sex);
    $('#txtTypearea').text(person.house_regist_type_name);
    $('#txtBirth').text(moment(person.birthdate).format('DD/MM/YYYY'));
    return Detail._getChronicClinic(hn);
  })
  .then(function (rows) {
    console.log(rows);
    $('#txtChronic').text(rows[0].chronic);
    return Detail._getDiagnosis(vn);
  })
  .then(function (rows) {
    $('#tblDiagnosis').DataTable({
      data: rows,
      columns: [
        { data: 'diag', title: 'รหัสวินิจฉัย' },
        { data: 'diagtype', title: 'ประเภทการวินิจฉัย' }
      ],
      "paging": false,
      "info": false,
      "searching": false,
      language: {
        "emptyTable": "ไม่พบข้อมูล"
      }
    });
    return Detail._getVisitDetail(vn);
  })
  .then(function (rows) {
    $('#txtDateServ').val(moment(rows[0].vstdate).format('DD/MM/YYYY'));
    $('#txtClinic').val(rows[0].spclty_name);
    $('#txtDoctor').val(rows[0].doctor_name);
    $('#txtDiag').val(rows[0].diag_name);
    $('#txtPttype').val(rows[0].pttype + " " + rows[0].pttype_name);

    return Detail._getProcedure(vn);
  })
  .then(function (rows) {
    $('#tblProcedures').DataTable({
      data: rows,
      columns: [
        { data: 'procedure_name', title: 'รายการหัตถการ' },
        { data: 'price', title: 'ราคา' },
      ],
      "paging": false,
      "info": false,
      "searching": false,
      language: {
        "emptyTable": "ไม่พบข้อมูล"
      }
    });

    return Detail._getCharges(vn);
  })
  .then(function (rows) {
    $('#tblCharges').DataTable({
      data: rows,
      columns: [
        { data: 'income_name', title: 'รายการค่าใช้จ่าย' },
        { data: 'price', title: 'ราคา' },
        { data: 'qty', title: 'จำนวน' },
        { data: 'totalPrice', title: 'รวม' },
      ],
      "paging": false,
      "info": false,
      "searching": false,
      language: {
        "emptyTable": "ไม่พบข้อมูล"
      }
    });
    return Detail._getDrugs(vn);
  })
  .then(function (rows) {
    $('#tblDrugs').DataTable({
      data: rows,
      columns: [
        { data: 'drug_name', title: 'รายการยา' },
        { data: 'usage_code', title: 'วิธีใช้' },
        { data: 'price', title: 'ราคา' },
        { data: 'qty', title: 'จำนวน' },
        { data: 'totalPrice', title: 'รวม' },
      ],
      "paging": false,
      "info": false,
      "searching": false,
      language: {
        "emptyTable": "ไม่พบข้อมูล"
      }
    });

    return Detail._getLabs(vn);
  })
  .then(function (rows) {
    $('#tblLabs').DataTable({
      data: rows,
      columns: [
        { data: 'lab_items_name', title: 'รายการ' },
        { data: 'lab_order_result', title: 'ผล' },
        { data: 'lab_items_unit', title: 'หน่วย' }
      ],
      "paging": false,
      "info": false,
      "searching": false,
      language: {
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
    // lab cholesterol = 102
    return Detail._getOpdScreenHistory(hn, '102');
  })
  .then(function (rows) {

    var items = [];

    _.forEach(rows, function (v) {
      var obj = {};
      obj.vn = v.vn;
      obj.vstdate = moment(v.vstdate).format('DD/MM/YYYY');
      obj.age_year = v.age_year;
      obj.bps = v.bps == null ? "-" : parseInt(v.bps);
      obj.bpd = v.bpd == null ? "-" : parseInt(v.bpd);
      obj.bp = obj.bps + '/' + obj.bpd;
      obj.cholesterol = v.cholesterol;
      obj.smoking = v.smoking == "Y" ? "สูบ" : "ไม่สูบ";

      items.push(obj);
    });

    $('#tblHistory').DataTable({
      data: items,
      "columnDefs": [ {
        "targets": 0,
        "visible": false
      } ],
      "ordering": false,
      "order": [[ 0, 'desc' ]],
      "columns": [
        { data: 'vn', title: 'VN' },
        { data: 'vstdate', title: 'วันที่' },
        { data: 'age_year', title: 'อายุ(ปี)' },
        { data: 'bp', title: 'ความดัน' },
        { data: 'cholesterol', title: 'Cholesterol' },
        { data: 'smoking', title: 'สูบบุหรี่' }
      ],
      "paging": true,
      "info": true,
      "searching": false,
      language: {
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

  var cvdchart = [
    {age: 65, bps: 125, cholesterol: 250, smoking: 'สูบ'}
  ];

  var cretinine = [
    {age: 65, sex: 'ชาย', cretinine: 0.9, state: 3}
  ];

  $('#tblCurrentCVDChart').DataTable({
    data: cvdchart,
    "ordering": false,
    "columns": [
      { data: 'age', title: 'อายุ(ปี)' },
      { data: 'bps', title: 'BPS' },
      { data: 'cholesterol', title: 'Chol' },
      { data: 'smoking', title: 'บุหรี่' }
    ],
    "paging": false,
    "info": false,
    "searching": false,
    language: {
      "emptyTable": "ไม่พบข้อมูล"
    }
  });

  $('#tblCurrentGFRState').DataTable({
    data: cretinine,
    "ordering": false,
    "columns": [
      { data: 'sex', title: 'เพศ' },
      { data: 'age', title: 'อายุ(ปี)' },
      { data: 'cretinine', title: 'Cre.' },
      { data: 'state', title: 'State' }
    ],
    "paging": false,
    "info": false,
    "searching": false,
    language: {
      "emptyTable": "ไม่พบข้อมูล"
    }
  });

  // initial tabs
  $(".tabcontrol").tabControl();

});
