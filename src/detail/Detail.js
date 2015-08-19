$(function () {
  var Q = require('q');
  var fse = require('fs-extra');
  var moment = require('moment');

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
      var sql = 'select o.vn, concat(o.icd10, " ", icd.name) as diag, ' +
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
    }
  };

  // Get diagnosis
  Detail._getDiagnosis(vn)
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

    return Detail._getPatientInfo(hn);
  })
  .then(function (rows) {
    var person = rows[0];
    $('#txtHN').text(person.hn);
    $('#txtCID').text(person.cid);
    $('#txtFullname').text(person.ptname);
    $('#txtAge').text(person.age);
    $('#txtSex').text(person.sex);
    $('#txtTypearea').text(person.house_regist_type_name);
    $('#txtBirth').text(moment(person.birthdate).format('DD/MM/YYYY'));

  }, function (err) {
    console.log(err);
  });

  // initial tabs
  $(".tabcontrol").tabControl();

});
