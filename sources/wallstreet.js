'use strict';
(function() {
  var path = require('path');
  var util = require("../utils.js")
  var Q = require('q');
  var StockNewsDB = require("../stocknewsdb.js")

  function parseWallStreetData(url, path, lastdate) {
    console.log(lastdate)
    var total = []
    var recursiveNum = 0
    var deferred = Q.defer();
    function recursiveDownload(article) {
        var articleListJson = JSON.parse(article);
        var articles = articleListJson["data"]["items"];
        var done = false
        for (var i in articles) {
          //console.log("parseWallStreetData -- ", articles[i]["display_time"]*1000, lastdate)
          if(articles[i]["display_time"]*1000 <= lastdate) {
            done = true
          }
          total.push(articles[i])
        }
        if (done) {
          deferred.resolve(total)
        } else {
          var newUrl = "https://api-prod.wallstreetcn.com/apiv1/content/articles?category=global&limit=20&platform=wscn-platform&cursor="
          newUrl += articleListJson["data"]["next_cursor"]
          var newPath = path + recursiveNum
          recursiveNum = recursiveNum + 1
          util.downloadUrlCallback(newUrl, newPath, true, "utf-8", function(err, doc) {
            if (err) {
              deferred.reject(err)
              return
            }
            recursiveDownload(doc)
          });
        }
        return deferred.promise;
    }

    return util.downloadUrl(url, path).then(recursiveDownload).then(consolidateArticle);
  }

  function consolidateArticle(articles) {
    console.log("consolidateArticle", articles.length)
    var tasks = [];
    for (var key in articles) {
      tasks.push(downloadWallStreetArticles(articles[key]));
    }
    return Q.all(tasks);
  }

  function downloadWallStreetArticles(article) {
    var cachepath = path.join("caches", "wallstreet", article["id"] + ".html")
    return util.downloadUrl(article["uri"], cachepath).then(util.parseHTML, (error) => {console.error(error); return undefined})
    .then(function(window) {
      if (!window) {
        return undefined;
      }

      article["content"] = window.$("div[class='node-article-content']").html();
      article["recvDate"] = article["display_time"] * 1000
      article["sourceId"] = "wallstreet"
      console.log(article["title"])
      return article;
    });
  }

  function WallStreetSource(db, cacheFolder) {
    util.mkdirpSync(path.join("caches", "wallstreet"));
    var homeUrl = "https://api-prod.wallstreetcn.com/apiv1/content/articles?platform=wscn-platform&category=global&limit=2"
    var homePath = path.join(cacheFolder, "wallstreet.json")

    return db.getLastUpdatedDate("wallstreet").then((lastdate) => parseWallStreetData(homeUrl, homePath, lastdate)).then(
      function(articles) {
        for (var index = 0; index < articles.length; index++) {
          if (!articles[index]) continue;
          db.saveDoc(articles[index]);
        }
        return "done"
      }
    );
  }

  if (typeof window !== 'undefined') {
    window.WallStreetSource = WallStreetSource;
  }

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = WallStreetSource;
  }
})();
