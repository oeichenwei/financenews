'use strict';
(function() {
  var fs = require("fs");
  var util = require("../utils.js")

  function CustomRating() {
    this.dailyBuckets = {};
  }

  /// The keywords list with score, please put narrower keywords on the top
  var keywordsJson = {
    "中间偏强": 60,
    "中间偏弱": -60,
    "偏强": 80,
    "偏弱": -80,
    "疲软": -100,
    "强": 100,
    "弱": -100
  };

  /// This function will handle one article, input is an array of sentences
  CustomRating.prototype.rateArticle = function (sentences) {
    var posScore = 0;
    var negScore = 0;

    for (var key in keywordsJson) { //iterate over the keywords from top to bottome
      for (var i = 0; i < sentences.length; i++) {  //iterate over the sentences
        if (sentences[i].indexOf(key) >= 0) { //Find the keywords from the sentences
          if (keywordsJson[key] > 0) {
            posScore += keywordsJson[key];  //postive result will be added to positive score
          } else {
            negScore += keywordsJson[key];  //negative result will be added to negative score
          }
          sentences[i] = "";  //Once the sentence has matched a narrower keyword, it will be removed from the list by set it to ""
        }
      }
    }
    return {"pos" : posScore, "neg": -negScore};  //return the result for one article
  }

  /// This function will compile the daily result into one daily score
  CustomRating.prototype.calculateDailyResult = function(outputFile) {
    //loop for each day
    var result = {};
    if (outputFile && fs.existsSync(outputFile)) {
      var historyResult = fs.readFileSync(outputFile);
      result = JSON.parse(historyResult);
    }
    for(var key in this.dailyBuckets) {
      var values = this.dailyBuckets[key];
      var posVal = 0;
      var negVal = 0;
      for(var i = 0; i < values.length; i++) {
        posVal = posVal + values[i]["pos"];
        negVal = negVal + values[i]["neg"];
      }
      var readableKey = (new Date(parseInt(key))).toLocaleDateString();
      result[readableKey] = {"pos": posVal, "neg": negVal, "sense": (posVal > negVal)};
    }
    console.log(result);
    if (outputFile) {
      fs.writeFileSync(outputFile, JSON.stringify(result));
    }
  }

  CustomRating.prototype.rate = function ($, doc) {
    var wrappedFullText = "<div>" + doc["content"] + "</div>";
    var txtStripped = $(wrappedFullText).text();
    //console.log(txtStripped);
    var result = this.rateArticle(txtStripped.split(/,|;|\.|\\n|，|；|。/g));
    return {"recvDate" : doc["recvDate"], "eval": result};
  }

  CustomRating.prototype.mapDailyResult = function (result) {
    var key = util.fitDateToDay(result["recvDate"]);
    if (!this.dailyBuckets[key]) {
      this.dailyBuckets[key] = [];
    }
    this.dailyBuckets[key].push(result["eval"]);
  }

  CustomRating.prototype.run = function (days, db, outputFile) {
    var _this = this;
    require("jsdom").env("", function(err, window) {
      var $ = require("jquery")(window);
      db.findRecentDocsCallback(days, (doc) => {
        _this.mapDailyResult(_this.rate($, doc));
      }, (err) => {
        if (err) {
          console.error(err);
        } else {
          _this.calculateDailyResult(outputFile);
        }
      });
    });
  }

  if (typeof window !== 'undefined') {
    window.CustomRating = CustomRating;
  }

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = CustomRating;
  }
})();
