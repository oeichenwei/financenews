'use strict';
(function() {
  var path = require('path');
  var util = require("../utils.js")
  var Q = require('q');
  var StockNewsDB = require("../stocknewsdb.js")

  function parseWallStreetData(url, path, lastdate) {
    console.log(lastdate)
    var lastHour = (new Date()).getTime() - 24*3600000;
    if (lastdate < lastHour) {
      lastdate = lastHour;
    }
    var total = []
    var recursiveNum = 0
    var deferred = Q.defer();
    function recursiveDownload(article) {
        var articleListJson = JSON.parse(article);
        var articles = articleListJson["data"]["items"];
        var done = false
        for (var i in articles) {
          if(articles[i]["display_time"]*1000 <= lastdate) {
            done = true
          }
          articles[i]["recvDate"] = articles[i]["display_time"]*1000;
          articles[i]["sourceId"] = "wallstreetlive";
          total.push(articles[i]);
        }
        if (done) {
          deferred.resolve(total)
        } else {
          var newUrl = "https://api-prod.wallstreetcn.com/apiv1/content/lives?channel=global-channel&client=pc&limit=20&cursor="
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

    return util.downloadUrl(url, path).then(recursiveDownload);
  }

  function WallStreetSourceLive(db, cacheFolder) {
    util.mkdirpSync(path.join("caches", "wallstreet"));
    var homeUrl = "https://api-prod.wallstreetcn.com/apiv1/content/lives?channel=global-channel&client=pc&limit=20"
    var homePath = path.join(cacheFolder, "wallstreetlive.json")

    return db.getLastUpdatedDate("wallstreetlive").then((lastdate) => parseWallStreetData(homeUrl, homePath, lastdate)).then(
      function(articles) {
        var result = Q();
        articles.forEach(function (article) {
          result = result.then(() => db.saveDoc(article));
        });
        return result;
      }
    ).then(() => {return "done"});
  }

  if (typeof window !== 'undefined') {
    window.WallStreetSourceLive = WallStreetSourceLive;
  }

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = WallStreetSourceLive;
  }
})();
