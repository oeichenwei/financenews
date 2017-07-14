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

  CrawlUtil.downloadUrlCallback = function(url, filepath, willZip, encoding, cb) {
    if (filepath && fs.existsSync(filepath)) {
      //console.log("  skipping, file has already been downloaded.", filepath);
      cb(undefined, fs.readFileSync(filepath, encoding));//"utf-8"
      return;
    }
    console.log("downloading " + url + "...");
    var options =  {timeout: 15000, gzip: willZip};
    if (encoding == "binary") {
      options["encoding"] = 'binary';
      options["jar"] = true;
    }
    request(url, options, function (error, response, body) {
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
      if (filepath) {
        fs.writeFileSync(filepath, body, encoding); //"utf-8"
      }
      console.log("  done url:", url);
      cb(undefined, body);
    });
  }

  CrawlUtil.downloadUrl = function(url, filepath, willZip = true) {
    var deferred = Q.defer();
    CrawlUtil.downloadUrlCallback(url, filepath, willZip, "utf-8", function(err, result) {
      if (err) {
        deferred.reject(err);
        return;
      }
      deferred.resolve(result);
    });
    return deferred.promise;
  }

  CrawlUtil.postForm = function(posturl, formdata) {
    var deferred = Q.defer();
    console.log("postForm url=", posturl, " form=", formdata);
    request.post({timeout: 15000, url:posturl, form: formdata, gzip:false, jar: true}, function(err, httpResponse, body){
      console.log("postForm", err, body);
      if (err) {
        deferred.reject(err);
        return;
      }
      deferred.resolve(body);
    });
    return deferred.promise;
  }

  CrawlUtil.downloadUrlWeixin = function(url, filepath, encoding = "utf-8", to = 3000) {
    var deferred = Q.defer();
    if (fs.existsSync(filepath)) {
      deferred.resolve(fs.readFileSync(filepath, encoding));
      return deferred.promise;
    }

    setTimeout(function(){
      CrawlUtil.downloadUrlCallback(url, filepath, false, encoding, function(err, result) {
        if (err) {
          deferred.reject(err);
          return;
        }
        deferred.resolve(result);
      });
    }, to);
    return deferred.promise;
  }

  CrawlUtil.safeUnlinkFile = function (filepath) {
    if (fs.existsSync(filepath)) {
      fs.unlinkSync(filepath);
    }
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

  var allSources = {
    "wallstreet": {type: "wallstreet", category: "general", name: "华尔街"},
    "cn-finance": {type: "weixin", category: "general", name: "中国金融杂志"},
    "haiqing_FICC": {type: "weixin", category: "general", name: "海清FICC频道"},
    "jrhycom": {type: "weixin", category: "general", name: "金融行业网"},
    "cebmmacro": {type: "weixin", category: "general", name: "莫尼塔宏观研究"},
    "CEBM_research": {type: "weixin", category: "general", name: "莫尼塔研究"},
    "zepinghongguan": {type: "weixin", category: "general", name: "泽平宏观"},
    "CHINAFINANCE40FORUM": {type: "weixin", category: "general", name: "中国金融四十人论坛"},
    "cfn-china": {type: "weixin", category: "general", name: "中国金融网"},
    "FN_FinancialNews": {type: "weixin", category: "general", name: "中国金融新闻网"},
    "midou888_zx": {type: "weixin", category: "future", name: "米斗资讯"},
    "qihuozhoukan": {type: "weixin", category: "future", name: " 大宗内参"},
    "gh_ae0f6dacaf22": {type: "weixin", category: "future", name: "东证衍生品研究院"},
    "hedgechina": {type: "weixin", category: "future", name: "对冲研投"},
    "hexun_futures": {type: "weixin", category: "future", name: "和讯期货"},
    "gh_a16e4bca4323": {type: "weixin", category: "future", name: "华信万达风云能化团"},
    "qhrb168": {type: "weixin", category: "future", name: " 期货日报"},
    "elogic": {type: "weixin", category: "future", name: "经济逻辑"},
    "jydmhg315": {type: "weixin", category: "future", name: " 金联创煤化工原金银岛煤化工资讯 "},
    "langeweixin": {type: "weixin", category: "future", name: "兰格钢铁网"},
    "gh_4a0f4b50dd80": {type: "weixin", category: "future", name: "鲁证能化观察"},
    "nhqhscfzb": {type: "weixin", category: "future", name: "南华期货网络金融"},
    "nmghgw": {type: "weixin", category: "future", name: "内蒙古化工"},
    "cjshcce": {type: "weixin", category: "future", name: "上海煤炭交易中心"},
    "puoketrader": {type: "weixin", category: "future", name: "扑克投资家"},
    "ykxj123": {type: "weixin", category: "future", name: "天然橡胶"},
    "v_breezes": {type: "weixin", category: "future", name: "V风"},
    "Wanhua_Petrochemical": {type: "weixin", category: "future", name: "万华化学石化资讯"},
    "Mysteel-shgl": {type: "weixin", category: "future", name: "我的钢铁网"},
    "erds4888": {type: "weixin", category: "future", name: "亚太地区煤炭交易中心"},
    "ydqhjy": {type: "weixin", category: "future", name: "一德菁英汇"},
    "zsqhyjs": {type: "weixin", category: "future", name: "招商期货研究所"},
    "zslsd_": {type: "weixin", category: "future", name: "找塑料视点"},
    "cncotton": {type: "weixin", category: "future", name: "中储棉花信息中心"},
    "CISA_chinaisa": {type: "weixin", category: "future", name: "中国钢铁工业协会"},
    "CCAON-lvjian": {type: "weixin", category: "future", name: "中国氯碱网"},
    "zlqh-yjy": {type: "weixin", category: "future", name: "中粮期货研究中心"},
    "macrocs": {type: "weixin", category: "future", name: "中信宏观研究"},
    "zhuochuangsteel": {type: "weixin", category: "future", name: "卓创钢铁"},
    "sciplas": {type: "weixin", category: "future", name: "卓创塑料"}
  };

  CrawlUtil.isGeneral = function(sourceId) {
    return allSources[sourceId].category === "general";
  }

  CrawlUtil.getFriendlyName = function(sourceId) {
    return allSources[sourceId].name;
  }

  CrawlUtil.getAllWeixinSources = function() {
    var ret = [];
    for (var key in allSources) {
      if (allSources[key].type === "weixin") {
        ret.push(key);
      }
    }
    return ret;
  }

  if (typeof window !== 'undefined') {
    window.CrawlUtil = CrawlUtil;
  }

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = CrawlUtil;
  }
})();
