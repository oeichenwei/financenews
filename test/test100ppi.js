var util = require('../utils.js');
var assert = require('assert');
var Get100ppiSource = require('../sources/100ppi.js');
var path = require('path');
var StockNewsDB = require("../stocknewsdb.js")

describe('test 100ppi', function() {
  it('test crawling 100ppi', function() {
    var theDate = new Date();
    var dayOfYear = theDate.getDOY().toString();
    var cacheFolder = path.join("caches", theDate.getFullYear().toString(), dayOfYear);
    util.mkdirpSync(cacheFolder);
    var db = new StockNewsDB();

    return Get100ppiSource(db, cacheFolder, "dianshi").then(console.log, function(err) {
      console.error(err);
      assert.ok(!err);
    });
  });
});
