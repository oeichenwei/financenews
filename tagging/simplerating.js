'use strict';
(function() {
  var fs = require("fs");
  var Q = require('q');
  var MongoClient = require('mongodb').MongoClient
  var util = require("../utils.js")

  var SimpleRating = {
  }

  SimpleRating.initalize = function() {
    var keywordsStr = fs.readFileSync("./keywords.json");
    SimpleRating.keywords = JSON.parse(keywordsStr);
  }

  SimpleRating.rateOne = function(fulltext) {
    var deferred = Q.defer();
    var keywordsJson = SimpleRating.keywords;
    require("jsdom").env("", function(err, window) {
      if (err) {
        console.error(err);
        deferred.reject(err);
        return;
      }
      var $ = require("jquery")(window);
      var wrappedFullText = "<div>" + fulltext + "</div>";
      var txtStripped = $(wrappedFullText).text();
      //console.log(txtStripped);
      var score = 0;
      var tags = [];
      for (var key in keywordsJson) {
        if (txtStripped.indexOf(key) >= 0) {
          score += keywordsJson[key];
          tags.push(key);
        }
      }
      var result = {"score": score, "tags": tags};
      deferred.resolve(result);
    });
    return deferred.promise;
  }

  if (typeof window !== 'undefined') {
    window.SimpleRating = SimpleRating;
  }

  if (typeof module !== 'undefined' && module.exports) {
    SimpleRating.initalize();
    module.exports = SimpleRating;
  }
})();
