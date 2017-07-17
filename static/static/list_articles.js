'use strict';

function hideArticle(aId, uri, recvDate) {
  console.log("hideArticle, id=", aId, ", uri=", uri, ", recvDate=", recvDate);
  markArticle(uri, recvDate, 0);
  $("div#"+aId).hide();
}

function markArticle(uri, recvDate, score) {
  console.log("markArticle, uri=", uri, ", recvDate=", recvDate, ", score=", score);
  $.ajax({
    url: "/score",
    data: {"uri": uri, "recvDate": recvDate, "score": score},
    dataType: "json",
    success: function(data) {
      console.log(data);
    }
  });
}

(function($) {
  function buildNav(leastDate, mostDate, sourceId, categoryId) {
    var sourceIdStr = "";
    if (sourceId) {
      sourceIdStr = "&sourceId=" + sourceId;
    }
    if (categoryId) {
      sourceIdStr = "&category=" + categoryId;
    }
    console.log("buildNav, next date=", mostDate, " previous date=", leastDate);
    var nav = $([
      '<nav>',
      ' <ul class="pager">',
      '  <li><a href="?type=prev&date=' + leastDate + sourceIdStr + '">上一页</a></li>',
      '  <li><a href="?type=next&date=' + mostDate + sourceIdStr + '">下一页</a></li>',
      ' </ul>',
      '</nav>'
    ].join("\n"));
    $("#articles").append(nav);
  }
  function listArticles(date, type, sourceId, categoryId) {
    $.ajax({
      url: "/query",
      data: {count: 15, "sourceId": sourceId, "category": categoryId, "type": type, "date": date}, //cn-finance
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
          var displayDate = (new Date(doc["recvDate"])).toLocaleDateString() + " " + (new Date(doc["recvDate"])).toLocaleTimeString()
          var author = doc["author"]
          if (doc["author"] instanceof Object) {
            author = doc["author"]["display_name"]
          }
          var url = undefined
          if (doc["uri"]) {
            url = doc["uri"]
          } else {
            url = "http://mp.weixin.qq.com" + doc["content_url"]
          }
          var contentHtml = "";
          if (doc["content"]) {
            contentHtml = doc["content"].replace(/<([a-z][a-z0-9]*)[^>]*>/gi, "<$1>");
            contentHtml = contentHtml.replace(/<h[0-9]([^>]*)>/gi, "<b$1>");
          }
          var score = "";
          if (doc["score"] != undefined)
            score = " [" + doc['score'] + "] ";
          var aId = doc["sourceId"] + "_" + (doc["id"] || doc["fileid"]);
          var hideButton = '<button class="btn" onclick="hideArticle(\'' + aId + '\',\'' + url + '\',' + doc["recvDate"] + ')">无关</button>';
          var positiveBtn = '<button class="btn btn-primary" onclick="markArticle(\'' + url + '\',' + doc["recvDate"] + ', 1)">正面</button>';
          var negativeBtn = '<button class="btn btn-primary" onclick="markArticle(\'' + url + '\',' + doc["recvDate"] + ', -1)">负面</button>';
          var row = $([
            '<div class="blog-post" id="' + aId + '">',
            '  <h2 class="blog-post-title">' + doc["title"] + score + '</h2>',
            '  <p class="blog-post-meta">' + displayDate + ' by ' + author + ' from ' + doc["sourceId"] + ' <a target="_blank" href="' + url + '">original link</a> ' + hideButton + '</p>',
            '  <p>' + contentHtml + '</p>',
            '  <p align="center"> ' + positiveBtn + '&nbsp;&nbsp;' + negativeBtn + '<br><br><br></p>',
            '</div><!-- /.blog-post -->'
            ].join("\n"));
          $("#articles").append(row);
        });

        buildNav(prevDate, nextDate, sourceId, categoryId)
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
  var categoryId = url_query('category')
  console.log("parsed URL parameters: date=", date, ", sourceId=", sourceId, ", type=", type)

  listArticles(date, type, sourceId, categoryId)
})(window.$);
