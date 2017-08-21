'use strict';
(function() {
  var path = require('path');
  var util = require("../utils.js")
  var Q = require('q');
  var StockNewsDB = require("../stocknewsdb.js")
  var fs = require("fs");
  const url = require('url');

  function parse100ppiHome(url, cacheFolder, lastdate) {
    //console.log("parse100ppiHome", url, " - ", cacheFolder, ", lastdate=", lastdate);
    return util.downloadUrl(url, cacheFolder).then(util.parseHTML).then(function(window) {
      var mostValueNews = window.$("h3.ys_tb2:contains('重点资讯')").parent().parent();
      var topNews = mostValueNews.find("h3.height_24p").children('a');
      var msgList = [];
      //console.log("parse100ppiHome mostValueNews=", topNews.text(), " ", topNews.attr('href'));
      msgList.push({uri: topNews.attr('href'), "title": topNews.text()});
      var listNews = mostValueNews.find("ul").children("li");
      listNews.each(function(idx) {
        var links = window.$(listNews[idx]).find("a");
        var theLink = window.$(links[1]);
        msgList.push({uri: theLink.attr('href'), "title": theLink.text()});
      })
      //console.log("parse100ppiHome listNews=", msgList);
      return msgList;
    });
  }

  function Save100PPIArticle(articleCache, article, id, db) {
    article["sourceId"] = id;
    article["id"] = (url.parse(article["uri"]).pathname.split("/")).slice(-1)[0];
    var articlePath = path.join(articleCache, article["id"]);
    return util.downloadUrl(article["uri"], articlePath).then(util.parseHTML).then(function(window) {
      var titleBar = window.$("div.nd-info");
      var content = window.$("div.nd-c");
      var nbsp = String.fromCharCode(160);
      var ndInfo = titleBar.text().trim().split(nbsp);
      ndInfo = ndInfo.filter(function(e){return e});
      if (ndInfo.length < 3) {
        console.error("Save100PPIArticle, ndInfo=", ndInfo);
        return "";
      }
      article["recvDate"] = util.parseChineseDate(ndInfo[1]);
      article["author"] = ndInfo[2];
      article["content"] = content.html();

      return db.saveDoc(article);
    });
  }

  function downloadPPIArticle(articleCache, articles, id, db) {
    //console.log("downloadPPIArticle, count=", articles.length);
    var result = Q();
    articles.forEach(function (article) {
      result = result.then(() => Save100PPIArticle(articleCache, article, id, db));
    });
    return result;
  }

  function Get100ppiSource(db, cacheFolder, id) {
    var articleCache = path.join("caches", "100ppi");
    util.mkdirpSync(articleCache);
    var homeUrl = "http://" + id + ".100ppi.com/";
    var homePath = path.join(cacheFolder, id + "_home.html");
    //console.log("Get100ppiSource", homeUrl," - ", homePath);

    return db.getLastUpdatedDate(id).then((lastdate) => parse100ppiHome(homeUrl, homePath, lastdate))
             .then((articles) => downloadPPIArticle(articleCache, articles,id, db))
             .then((dbresult) => util.waitTimeout(1000, " done " + id));
  }

  if (typeof window !== 'undefined') {
    window.Get100ppiSource = Get100ppiSource;
  }

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = Get100ppiSource;
  }
})();
