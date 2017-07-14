'use strict';
(function() {
  var path = require('path');
  var util = require("../utils.js")
  var Q = require('q');
  var StockNewsDB = require("../stocknewsdb.js")
  var fs = require("fs");

  function parse100ppiHome(url, cacheFolder, lastdate) {
    //console.log("parse100ppiHome", url, " - ", cacheFolder, ", lastdate=", lastdate);
    return util.downloadUrl(url, cacheFolder).then(util.parseHTML).then(function(window) {
      var mostValueNews = window.$("h3.ys_tb2:contains('重点资讯')").parent().parent();
      var topNews = mostValueNews.find("h3.height_24p").children('a');
      console.log("parse100ppiHome mostValueNews=", topNews.text(), " ", topNews.attr('href'));
      var listNews = mostValueNews.children("ul").children();
      listNews.each(function(a) {
        console.log(a);
      })
      console.log("parse100ppiHome listNews=");
      return "done";
    });
  }

  function Get100ppiSource(db, cacheFolder, id) {
    util.mkdirpSync(path.join("caches", "100ppi"));
    var homeUrl = "http://" + id + ".100ppi.com/";
    var homePath = path.join(cacheFolder, id + "_home.html");
    //console.log("Get100ppiSource", homeUrl," - ", homePath);

    return db.getLastUpdatedDate(id).then((lastdate) => parse100ppiHome(homeUrl, homePath, lastdate));
  }

  if (typeof window !== 'undefined') {
    window.Get100ppiSource = Get100ppiSource;
  }

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = Get100ppiSource;
  }
})();
