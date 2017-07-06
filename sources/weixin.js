'use strict';
(function() {
  var path = require('path');
  var util = require("../utils.js")
  var Q = require('q');
  var StockNewsDB = require("../stocknewsdb.js")

  function SearchAccount(cacheFolder, id) {
      let url = "http://weixin.sogou.com/weixin?type=1&s_from=input&ie=utf8&_sug_=n&_sug_type_=&query=" + id
      let searchPath = path.join(cacheFolder, "search_" + id + ".html")
      return util.downloadUrl(url, searchPath).then(util.parseHTML).then(function(window) {
        let theLink = window.$("div[class='txt-box']").children("p").children("a")
        return theLink.attr("href");
      });
  }

  function ListRecentArticles(url, cacheFolder, id) {
    let listPath = path.join(cacheFolder, "list_" + id + ".html")
    return util.downloadUrlWeixin(url, listPath).then(util.parseHTML).then(function(window) {
      let theScripts = window.$("script")
      var msgList = undefined
      for(var idx = 0; idx < theScripts.length; idx++) {
        let snip = theScripts[idx]
        let beginStr = "var msgList ="
        let startPos = snip.text.indexOf(beginStr)
        if (startPos > 0) {
          let endPos = snip.text.indexOf("};")
          msgList = JSON.parse(snip.text.slice(startPos + beginStr.length, endPos + 1))
          //console.log(msgList.list[0])
        }
      }
      var retList = []
      for (var i = 0; i < msgList.list.length; i++) {
        var basicItem = msgList.list[i]["app_msg_ext_info"]
        basicItem["comm_msg_info"] = msgList.list[i]["comm_msg_info"]
        retList.push(basicItem)
        if (msgList.list[i]["app_msg_ext_info"]["is_multi"] > 0 ) {
          var multiList =  msgList.list[i]["app_msg_ext_info"]["multi_app_msg_item_list"]
          for (var k = 0; k < multiList.length; k++) {
            var multiItem = multiList[k]
            multiItem["comm_msg_info"] = msgList.list[i]["comm_msg_info"]
            retList.push(multiItem)
          }
        }
      }
      return retList
    })
  }

  function SaveWeixinArticle(article, id) {
    var url;
    if (article["content_url"].indexOf("http://") >= 0) {
      url = article["content_url"].replace(/&amp;/gi,"&");
    } else {
      url = "http://mp.weixin.qq.com" + article["content_url"].replace(/&amp;/gi,"&");
    }
    let cacheArticlePath = path.join("caches", "weixin", id + "_" + article["fileid"] + "_" + article["comm_msg_info"]["id"] + ".html")
    return util.downloadUrlWeixin(url, cacheArticlePath).then(util.parseHTML).then(function(window) {
      let content =  window.$("div[id='js_content']").html();
      //console.log(content)
      article["content"] = content
      article["recvDate"] = article["comm_msg_info"]["datetime"] * 1000
      article["sourceId"] = id
      article["uri"] = url
      return article
    })
  }

  function DownloadWeixinArticle(articles, id) {
    var tasks = [];
    for (var key in articles) {
      tasks.push(SaveWeixinArticle(articles[key], id));
    }
    return Q.all(tasks);
  }

  function WeixinSource(db, cacheFolder, id) {
    util.mkdirpSync(path.join("caches", "weixin"));

    var _lastdate = 0;
    return db.getLastUpdatedDate(id).then((lastdate) => {
      _lastdate = lastdate;
      return SearchAccount(cacheFolder, id).then((url) => ListRecentArticles(url, cacheFolder, id))
                .then((articles) => DownloadWeixinArticle(articles, id))
                .then(function(articles) {
                    for (var index in articles) {
                      db.saveDoc(articles[index]);
                      //console.log(articles[index]["uri"])
                    }
                    return "done"
                })
    });
  }

  if (typeof window !== 'undefined') {
    window.WeixinSource = WeixinSource;
  }

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = WeixinSource;
  }
  })();