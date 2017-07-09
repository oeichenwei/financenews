'use strict';
(function() {
  var Q = require('q')
  var MongoClient = require('mongodb').MongoClient
  var util = require("./utils.js")

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
    MongoClient.connect(this.dburl, function(err, db) {
      if (err) {
        deferred.reject(err);
        return;
      }
      var collection = db.collection('articles');
      //console.info("saveDoc");
      if (util.isGeneral(doc["sourceId"])) {
        doc["category"] = "general";
      } else {
        doc["category"] = "future";
      }

      var key = {recvDate : doc["recvDate"], uri: doc["uri"]}
      let value = Object.assign({}, doc);
      delete value.recvDate
      delete value.uri
      collection.updateOne(key, {$set: value}, {upsert:true}, function(err, result) {
        if (err) {
          console.error(err, result);
        }
        db.close();
        //console.log("saved");
        deferred.resolve(result);
      });
    });
    return deferred.promise;
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
        var lastUpdateDate = (new Date()).getTime() - 24*3600000
        if (docs.length > 0) {
          lastUpdateDate = docs[0]["recvDate"];
          if (util.lastRun && util.lastRun.details) {
            var updateObj = {"key": sourceId, "update": lastUpdateDate, "name": util.getFriendlyName(sourceId)};
            util.lastRun.details.push(updateObj);
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

  StockNewsDB.prototype.updateCategory = function(sourceId) {
    console.log("updateCategory", sourceId);
    var deferred = Q.defer();
    MongoClient.connect(this.dburl, function(err, db) {
      if (err) {
        deferred.reject(err);
        return;
      }
      var category = "future";
      if (util.isGeneral(sourceId)) {
        category = "general";
      }

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
