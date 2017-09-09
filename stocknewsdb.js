'use strict';
(function() {
  var Q = require('q')
  var MongoClient = require('mongodb').MongoClient
  var util = require("./utils.js")
  var simpleRate = require('./tagging/simplerating.js');

  function StockNewsDB(url) {
    console.log("StockNewsDB new instance, url=", url)
    if (url) {
      this.dburl = url
    } else {
      // default URL
      this.dburl = 'mongodb://localhost:27017/stocknews';
    }
  }

  StockNewsDB.prototype.createIndex = function() {
    var deferred = Q.defer();
    MongoClient.connect(this.dburl, function(err, db) {
      if (err) {
        deferred.reject(err);
        return;
      }
      var collection = db.collection('articles');
      collection.createIndex( { recvDate : -1, uri: -1 }, { unique: true }, function(err, result) {
        if (err) {
          deferred.reject(err);
          return;
        }
        db.close();
        deferred.resolve(result);
      });
    });
    return deferred.promise;
  }

  StockNewsDB.prototype.saveDoc = function(doc) {
    var deferred = Q.defer();
    var _this = this;
    MongoClient.connect(this.dburl, function(err, db) {
      if (err) {
        deferred.reject(err);
        return;
      }
      var collection = db.collection('articles');
      doc["category"] = util.getCategory(doc["sourceId"]);
      var nowTime = (new Date()).getTime();
      if (doc["recvDate"] > nowTime) {
        console.log("StockNewsDB.saveDoc correct the wrong recvDate to current date.", doc["recvDate"], nowTime);
        doc["recvDate"] = nowTime;
      }
      //console.info("saveDoc", doc);
      var key = {recvDate : doc["recvDate"], uri: doc["uri"]}
      let value = Object.assign({}, doc);
      delete value.recvDate
      delete value.uri

      if (util.lastRun && util.lastRun.details) {
        let updateObj = util.lastRun.details[doc["sourceId"]];
        if (updateObj && doc["recvDate"] > updateObj["update"]) {
          updateObj["update"] = doc["recvDate"];
        } else {
          util.lastRun.details[doc["sourceId"]] = {"update": doc["recvDate"], "name": util.getFriendlyName(doc["sourceId"])};
        }
      }

      simpleRate.rateOne(doc["content"]).then( (rating) => {
        value["simpleRate"] = rating;
        collection.updateOne(key, {$set: value}, {upsert:true}, function(err, result) {
          if (err) {
            console.error(err, result);
          }
          db.close();
          //console.log("saved");
          deferred.resolve(result);
        });
      });
    });
    return deferred.promise;
  }

  StockNewsDB.prototype.resaveDocRecursively = function (docs) {
    var result = Q();
    var _this = this;
    console.log("resaveDocRecursively", this);
    docs.forEach(function (doc) {
      result = result.then(() => _this.saveDoc(doc));
    });
    return result;
  }

  StockNewsDB.prototype.findRecentUnratedDocs = function(days, force) {
    if (!days) {
      days = 1;
    }
    var deferred = Q.defer();
    var _this = this;
    MongoClient.connect(this.dburl, function(err, db) {
      if (err) {
        deferred.reject(err);
        return;
      }
      console.log("Connected correctly to server for ratingForDays days=", days);
      var sinceDate = (new Date()).getTime() - days * 24 * 3600000;
      var queryCondition = {"recvDate": { $gt: sinceDate }, "simpleRate": { $eq: null}};
      if (force) {
        delete queryCondition.simpleRate;
      }
      //console.log(queryCondition)
      db.collection('articles').find(queryCondition).toArray(function(err, docs) {
        if (err) {
          deferred.reject(err);
          return;
        }
        db.close();
        deferred.resolve(docs);
      });
    });
    return deferred.promise;
  }

  StockNewsDB.prototype.findRecentDocsCallback = function(days, okcb, errcb) {
    if (!days) {
      days = 1;
    }
    var _this = this;
    MongoClient.connect(this.dburl, function(err, db) {
      if (err) {
        errcb(err);
        return;
      }
      console.log("Connected correctly to server for findRecentDocsCallback days=", days);
      var sinceDate = (new Date()).getTime() - days * 24 * 3600000;
      var queryCondition = {"recvDate": { $gt: sinceDate }};
      db.collection('articles').find(queryCondition).forEach(function(doc) {
        if (doc) {
          okcb(doc);
        }
      }, function(err) {
        db.close();
        errcb(err);
        //console.log("findRecentDocsCallback done");
      });
    });
  }

  StockNewsDB.prototype.getLastUpdatedDate = function(sourceId) {
    var deferred = Q.defer();
    MongoClient.connect(this.dburl, function(err, db) {
      if (err) {
        deferred.reject(err);
        return;
      }
      console.log("Connected correctly to server for getLastUpdatedDate");
      db.collection('articles').find({"sourceId": sourceId}, {sort: {"recvDate": -1}, limit: 1}).toArray(function(err, docs) {
        if (err) {
          deferred.reject(err);
          return;
        }
        db.close();
        var lastUpdateDate = (new Date()).getTime() - 24*3600000;
        if (docs.length > 0) {
          lastUpdateDate = docs[0]["recvDate"];
          if (util.lastRun && util.lastRun.details) {
            util.lastRun.details[sourceId] = {"update": lastUpdateDate, "name": util.getFriendlyName(sourceId)};
          }
        }
        deferred.resolve(lastUpdateDate);
      });
    });
    return deferred.promise;
  }

  StockNewsDB.prototype.listArticles = function(count, datetime, type, sourceId, categoryId) {
    var deferred = Q.defer();
    MongoClient.connect(this.dburl, function(err, db) {
      if (err) {
        deferred.reject(err);
        return;
      }
      console.log("Connected correctly to server for listArticles date=", datetime, "sourceId=", sourceId);
      if (!datetime || datetime <= 0) {
        datetime = (new Date()).getTime()
      }
      var sortOrder = -1
      var queryCondition = {"recvDate": { $lt: datetime }}
      if (type == "prev") {
        queryCondition = {"recvDate": { $gt: datetime }}
        sortOrder = 1
      }

      if (sourceId && sourceId.length > 0) {
        queryCondition["sourceId"] = sourceId
      }

      if (categoryId && categoryId.length > 0) {
        queryCondition["category"] = categoryId
      }
      console.log(queryCondition)
      db.collection('articles').find(queryCondition, {sort: {"recvDate": sortOrder}, limit: count}).toArray(function(err, docs) {
        if (err) {
          deferred.reject(err);
          return;
        }
        db.close();
        deferred.resolve(docs);
      });
    });
    return deferred.promise;
  }

  StockNewsDB.prototype.listArticlesOrderByScore = function(skip, count, datetime, sourceId, categoryId) {
    var deferred = Q.defer();
    MongoClient.connect(this.dburl, function(err, db) {
      if (err) {
        deferred.reject(err);
        return;
      }
      console.log("Connected correctly to server for listArticlesOrderByScore date=", datetime, "sourceId=", sourceId);
      if (!datetime || datetime <= 0) {
        datetime = (new Date()).getTime() - 24*3600000
      }
      var queryCondition = {"recvDate": { $gt: datetime }}
      if (sourceId && sourceId.length > 0) {
        queryCondition["sourceId"] = sourceId
      }
      if (categoryId && categoryId.length > 0) {
        queryCondition["category"] = categoryId
      }
      console.log(queryCondition)
      db.collection('articles').find(queryCondition, {"skip": skip, sort: {"simpleRate.score": -1}, limit: count}).toArray(function(err, docs) {
        if (err) {
          deferred.reject(err);
          return;
        }
        db.close();
        deferred.resolve(docs);
      });
    });
    return deferred.promise;
  }

  StockNewsDB.prototype.updateScore = function(uri, recvDate, score) {
    var deferred = Q.defer();
    MongoClient.connect(this.dburl, function(err, db) {
      if (err) {
        deferred.reject(err);
        return;
      }
      var collection = db.collection('articles');
      collection.update({"uri": uri.trim(), "recvDate": recvDate}, {$set: {"score": score}}, function(err, result) {
        if (err) {
          console.error(err, result);
        }
        console.log("done for updateScore uri=", uri, ", score=", score);
        db.close();
        deferred.resolve("success");
      });
    });
    return deferred.promise;
  }

  StockNewsDB.prototype.updateCategory = function(sourceId) {
    console.log("updateCategory", sourceId);
    var deferred = Q.defer();
    MongoClient.connect(this.dburl, function(err, db) {
      if (err) {
        deferred.reject(err);
        return;
      }
      var category = util.getCategory(sourceId);

      console.log("updateCategory category=", category);
      var collection = db.collection('articles');
      collection.update({"sourceId": sourceId}, {$set: {"category": category}}, {multi: true}, function(err, result) {
        if (err) {
          console.error(err, result);
        }
        console.log("done for ", sourceId);
        db.close();
        deferred.resolve("updated");
      });
    });
    return deferred.promise;
  }

  if (typeof window !== 'undefined') {
    window.StockNewsDB = StockNewsDB;
  }

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = StockNewsDB;
  }
})();
