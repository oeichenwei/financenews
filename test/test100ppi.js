var util = require('../utils.js');
var assert = require('assert');
var Get100ppiSource = require('../sources/100ppi.js');
var path = require('path');
var StockNewsDB = require("../stocknewsdb.js");
const url = require('url');

describe('test 100ppi', function() {
  it('test crawling 100ppi', function() {
    var theDate = new Date();
    var dayOfYear = theDate.getDOY().toString();
    var cacheFolder = path.join("caches", theDate.getFullYear().toString(), dayOfYear);
    util.mkdirpSync(cacheFolder);
    var db = new StockNewsDB();

    var uri = "http://www.100ppi.com/news/detail-20170714-1095430.html";
    var id = (url.parse(uri).pathname.split("/")).slice(-1)[0];
    assert.equal(id, "detail-20170714-1095430.html");

    var dateText = "2017年08月19日 17:22";
    assert.equal(util.parseChineseDate(dateText), Date.parse("2017-08-19 17:22:00"));

    return Get100ppiSource(db, cacheFolder, "dianshi").then(console.log, function(err) {
      console.error(err);
      assert.ok(!err);
    });
  }).timeout(10000);;
});
