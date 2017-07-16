var util = require('../utils.js');
var assert = require('assert');
var GetChinaCefNews = require('../sources/chinacef.js');
var path = require('path');
var StockNewsDB = require("../stocknewsdb.js");
const url = require('url');

describe('test chinacef', function() {
  it('test crawling chinacef', function() {
    var theDate = new Date();
    var dayOfYear = theDate.getDOY().toString();
    var cacheFolder = path.join("caches", theDate.getFullYear().toString(), dayOfYear);
    util.mkdirpSync(cacheFolder);
    var db = new StockNewsDB();

    return GetChinaCefNews(db, cacheFolder).then(console.log, function(err) {
      console.error(err);
      assert.ok(!err);
    });
  }).timeout(50000);;
});
