'use strict';
(function() {
  var request = require("request");
  var fs = require("fs");
  var path = require('path');
  var Q = require('q');
  var jquery = fs.readFileSync("./node_modules/jquery/dist/jquery.js", "utf-8");
  var jsdom = require("jsdom");

  var CrawlUtil = {
  }

  CrawlUtil.isGeneral = function(sourceId) {
    var generalSources = ["wallstreet", "cn-finance", "haiqing_FICC", "jrhycom",
          "cebmmacro",  "CEBM_research", "zepinghongguan", "CHINAFINANCE40FORUM",
          "cfn-china", "FN_FinancialNews"];
    return generalSources.includes(sourceId);
  }

  CrawlUtil.mkdirSync = function(path) {
    try {
      fs.mkdirSync(path);
    } catch(e) {
      if ( e.code != 'EEXIST' ) throw e;
    }
  }

  CrawlUtil.mkdirpSync = function(dirpath) {
    var parts = dirpath.split(path.sep);
    for( var i = 1; i <= parts.length; i++ ) {
      CrawlUtil.mkdirSync( path.join.apply(null, parts.slice(0, i)) );
    }
  }

  Date.prototype.getDOY = function() {
      var mn = this.getMonth();
      var dn = this.getDate();
      return (mn + 1).toString() + "-" + dn.toString();
  };

  CrawlUtil.downloadUrlCallback = function(url, filepath, willZip, cb) {
    if (fs.existsSync(filepath)) {
      //console.log("  skipping, file has already been downloaded.", filepath);
      cb(undefined, fs.readFileSync(filepath, "utf-8"));
      return;
    }
    console.log("downloading " + url + "...");
    request(url, {timeout: 15000, gzip: willZip}, function (error, response, body) {
      if (error || response.statusCode != 200) {
        console.log("  error on downloading url:" + url);
        if (error) {
          console.error(error);
        } else {
          error = new Error("download failed with status code:" + response.statusCode)
        }
        cb(error, undefined);
        return;
      }
      fs.writeFileSync(filepath, body, "utf-8");
      console.log("  done url:", url);
      cb(undefined, body);
    });
  }

  CrawlUtil.downloadUrl = function(url, filepath, willZip = true) {
    var deferred = Q.defer();
    CrawlUtil.downloadUrlCallback(url, filepath, willZip, function(err, result) {
      if (err) {
        deferred.reject(err);
        return;
      }
      deferred.resolve(result);
    });
    return deferred.promise;
  }

  CrawlUtil.downloadUrlWeixin = function(url, filepath) {
    var deferred = Q.defer();
    setTimeout(function(){
      CrawlUtil.downloadUrlCallback(url, filepath, false, function(err, result) {
        if (err) {
          deferred.reject(err);
          return;
        }
        deferred.resolve(result);
      });
    }, 3000);
    return deferred.promise;
  }

  CrawlUtil.parseHTMLCallback = function(body, callback) {
    jsdom.env({
      html: body,
      src: [jquery],
      done: function (err, window) {
        callback(err, window);
      }
    });
  }

  CrawlUtil.parseHTML = function(body) {
    var deferred = Q.defer();
    CrawlUtil.parseHTMLCallback(body, function(err, window) {
      if (err) deferred.reject(err);
      deferred.resolve(window);
    });
    return deferred.promise;
  }

  CrawlUtil.waitTimeout = function(ms, input) {
    var deferred = Q.defer();
    setTimeout(function(){
      console.log('waitTimeout = ', ms)
      deferred.resolve(input);
    }, ms);
    return deferred.promise;
  }

  CrawlUtil.deleteFolderRecursive = function(path) {
    var files = [];
    if( fs.existsSync(path) ) {
        files = fs.readdirSync(path);
        files.forEach(function(file,index) {
            var curPath = path + "/" + file;
            if(fs.lstatSync(curPath).isDirectory()) { // recurse
                deleteFolderRecursive(curPath);
            } else { // delete file
                fs.unlinkSync(curPath);
            }
        });
        fs.rmdirSync(path);
    }
  };

  if (typeof window !== 'undefined') {
    window.CrawlUtil = CrawlUtil;
  }

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = CrawlUtil;
  }
})();
