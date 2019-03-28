var util = require('../utils.js');
var assert = require('assert');
var WeixinSource = require('../sources/weixin.js');
var path = require('path');
var StockNewsDB = require("../stocknewsdb.js");
const url = require('url');

describe('test weixin', function() {
  it('test weixin search', function() {
    var theDate = new Date();
    var dayOfYear = theDate.getDOY().toString();
    var cacheFolder = path.join("caches", theDate.getFullYear().toString(), dayOfYear);
    util.mkdirpSync(cacheFolder);
    var db = null//new StockNewsDB();

    return WeixinSource(db, cacheFolder, 'cn-finance').then(console.log, function(err) {
      console.error(err);
      assert.ok(!err);
    });
  }).timeout(50000);;
});

