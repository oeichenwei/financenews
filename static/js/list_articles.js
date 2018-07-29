'use strict';

(function() {
  window.jQuery = window.$ = require('jquery')

  function buildNav(leastDate, mostDate, sourceId) {
    var sourceIdStr = ""
    if (sourceId) {
      sourceIdStr = "&sourceId=" + sourceId
    }
    console.log("buildNav, next date=", mostDate, " previous date=", leastDate)
    let nav = $([
      '<nav>',
      ' <ul class="pager">',
      '  <li><a href="?type=prev&date=' + leastDate + sourceIdStr + '">上一页</a></li>',
      '  <li><a href="?type=next&date=' + mostDate + sourceIdStr + '">下一页</a></li>',
      ' </ul>',
      '</nav>'
    ].join("\n"));
    $("#articles").append(nav);
  }

  function listArticles(date, type, sourceId) {
    $.ajax({
      url: "/query",
      data: {count: 20, "sourceId": sourceId, "type": type, "date": date}, //cn-finance
      dataType: "json",
      success: function(data) {
        console.log("listArticles success:", data.length)
        var nextDate = 0
        var prevDate = 0
        data.sort(function(a, b) {
          if (a["recvDate"] == b["recvDate"])
            return 0;
          else if(a["recvDate"] < b["recvDate"])
            return 1;
          return -1;
        })
        data.forEach(function(doc) {
          if (nextDate == 0 || nextDate > doc["recvDate"]) {
            nextDate = doc["recvDate"]
          }
          if (prevDate == 0 || prevDate < doc["recvDate"]) {
            prevDate = doc["recvDate"]
          }
          let displayDate = (new Date(doc["recvDate"])).toLocaleDateString()
          let author = doc["author"]
          if (doc["author"] instanceof Object) {
            author = doc["author"]["display_name"]
          }
          var url = undefined
          if (doc["sourceId"] === "wallstreet") {
            url = doc["uri"]
          } else {
            url = "http://mp.weixin.qq.com" + doc["content_url"]
          }
          let row = $([
            '<div class="blog-post">',
            '  <h2 class="blog-post-title">' + doc["title"] + '</h2>',
            '  <p class="blog-post-meta">' + displayDate + ' by ' + author + ' from ' + doc["sourceId"] + ' <a target="_blank" href="' + url + '">original link</a></p>',
            '  <p>' + doc["content"] + '</p>',
            '</div><!-- /.blog-post -->'
            ].join("\n"));
          $("#articles").append(row);
        });

        buildNav(prevDate, nextDate, sourceId)
      }
    });
  }

  function url_query( query ) {
    query = query.replace(/[\[]/,"\\\[").replace(/[\]]/,"\\\]");
    var expr = "[\\?&]"+query+"=([^&#]*)";
    var regex = new RegExp( expr );
    var results = regex.exec( window.location.href );
    if ( results !== null ) {
        return results[1];
    } else {
        return undefined;
    }
  }
  var date = url_query('date')
  date = date ? parseInt(date) : 0
  var type = url_query('type')
  type = type ? type : "next"
  var sourceId = url_query('sourceId')
  console.log("parsed URL parameters: date=", date, ", sourceId=", sourceId, ", type=", type)

  listArticles(date, type, sourceId)
})();
