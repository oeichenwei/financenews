'use strict';
(function() {
  var path = require('path');
  var util = require("../utils.js")
  var Q = require('q');
  var StockNewsDB = require("../stocknewsdb.js")
  var fs = require("fs");
  const url = require('url');

  var id = "chinacef";

  function parseChinacefHome(url, cacheFolder, lastUpdateDate) {
    return util.downloadUrl(url, cacheFolder).then(util.parseHTML).then(function(window) {
      var msgList = [];
      var listNews = window.$("div.bspacing10");
      listNews.each(function(idx) {
        var titleBar = window.$(listNews[idx]).find("h3");
        var link = "http://www.chinacef.cn" + titleBar.children("a").attr("href");
        var id = link.split("/").slice(-1)[0];
        var author = window.$(listNews[idx]).find("a[rel='author']").text();
        var nbsp = String.fromCharCode(160);
        var dateTxt = window.$(listNews[idx]).find("div.metax").text().split(nbsp).slice(-1)[0];
        var contentShort = window.$(listNews[idx]).find("div.storycontent").children("div.colord").text().trim();
        msgList.push({"title": titleBar.text().trim(),
                      "id": id, "author": author, "content_short": contentShort, "uri": link, "recvDate":  Date.parse(dateTxt)});
      });
      return msgList;
    });
  }

  function saveChinacefArticle(articleCache, article, db) {
    var articlePath = path.join(articleCache, article["id"] + ".html");
    return util.downloadUrl(article["uri"], articlePath).then(util.parseHTML).then(function(window) {
      article["content"] = window.$("div.newsmaintext").html();
      article["sourceId"] = id;
      return db.saveDoc(article);
    });
  }

  function downloadChinacefArticle(articleCache, articles, db) {
    //console.log("downloadPPIArticle, count=", articles.length);
    var result = Q();
    articles.forEach(function (article) {
      result = result.then(() => saveChinacefArticle(articleCache, article, db));
    });
    return result;
  }

  function GetChinaCefNews(db, cacheFolder) {
    var articleCache = path.join("caches", "chinacef");
    util.mkdirpSync(articleCache);
    var homeUrl = "http://www.chinacef.cn/index.php/index/articlemore";
    var homePath = path.join(cacheFolder, "chinacef_home.html");
    //console.log("Get100ppiSource", homeUrl," - ", homePath);

    return db.getLastUpdatedDate(id).then((lastdate) => parseChinacefHome(homeUrl, homePath, lastdate))
             .then((articles) => downloadChinacefArticle(articleCache, articles, db));
  }

  if (typeof window !== 'undefined') {
    window.GetChinaCefNews = GetChinaCefNews;
  }

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = GetChinaCefNews;
  }
})();
