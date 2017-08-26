var util = require('../utils.js');
var assert = require('assert');
var WallStreetSourceLive = require('../sources/wallstreet-live.js');
var path = require('path');
var StockNewsDB = require("../stocknewsdb.js");
const url = require('url');

describe('test wallstreet-live', function() {
  it('test crawling wallstreet-live', function() {
    var theDate = new Date();
    var dayOfYear = theDate.getDOY().toString();
    var cacheFolder = path.join("caches", theDate.getFullYear().toString(), dayOfYear);
    util.mkdirpSync(cacheFolder);
    var db = new StockNewsDB();

    return WallStreetSourceLive(db, cacheFolder).then(console.log, function(err) {
      console.error(err);
      assert.ok(!err);
    });
  }).timeout(50000);;
});
