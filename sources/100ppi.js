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
      var msgList = [];
      console.log("parse100ppiHome mostValueNews=", topNews.text(), " ", topNews.attr('href'));
      msgList.push({content_url: topNews.attr('href'), "content_short": topNews.text()});
      var listNews = mostValueNews.find("ul").children("li");
      listNews.each(function(idx) {
        var links = window.$(listNews[idx]).find("a");
        var theLink = window.$(links[1]);
        msgList.push({content_url: theLink.attr('href'), "content_short": theLink.text()});
      })
      //console.log("parse100ppiHome listNews=", msgList);
      return msgList;
    });
  }

  function downloadPPIArticle(articles) {

  }

  function Get100ppiSource(db, cacheFolder, id) {
    util.mkdirpSync(path.join("caches", "100ppi"));
    var homeUrl = "http://" + id + ".100ppi.com/";
    var homePath = path.join(cacheFolder, id + "_home.html");
    //console.log("Get100ppiSource", homeUrl," - ", homePath);

    return db.getLastUpdatedDate(id).then((lastdate) => parse100ppiHome(homeUrl, homePath, lastdate))
             .then((articles) => downloadPPIArticle());
  }

  if (typeof window !== 'undefined') {
    window.Get100ppiSource = Get100ppiSource;
  }

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = Get100ppiSource;
  }
})();
