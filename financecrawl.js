//https://api-prod.wallstreetcn.com/apiv1/content/articles?platform=wscn-platform&category=us&limit=2
//https://api-prod.wallstreetcn.com/apiv1/content/articles?category=global&limit=20&cursor=1495266969,1495182986&platform=wscn-platform
//http://mp.weixin.qq.com/profile?src=3&timestamp=1495273101&ver=1&signature=KZklWmPdhiT8JK2cxh7BzXIGn-93e8F-ZM98KxatRnUkSmdu*yIvwJI6FzO8sP9ZVklm2jkycw4W0expZKTGpw==
//http://mp.weixin.qq.com/profile?src=3&timestamp=1495279336&ver=1&signature=KZklWmPdhiT8JK2cxh7BzXIGn-93e8F-ZM98KxatRnUkSmdu*yIvwJI6FzO8sP9ZXSmMKdul0GITVz5H4*sqvw==

//cn-finance
//midou888_zx

//http://weixin.sogou.com/gzhjs?cb=sogou.weixin.gzhcb&openid=midou888_zx&eqs={eqs}&ekv={ekv}&page=1&t=1495273101

//https://api.starter-us-east-1.openshift.com/oapi/v1/namespaces/snips/buildconfigs/nodejs-mongo-persistent/webhooks/EJhE64Rs2YNcPG6FLsTmaw6xUpbyVAm7PBF4hCsu/github
//mongod --logpath D:\web\mongodb\logs\MongoDB.log --logappend --dbpath D:\web\mongodb --directoryperdb --serviceName MongoDB --install

'use strict';
(function() {
  var path = require('path');
  var util = require("./utils.js")
  var StockNewsDB = require("./stocknewsdb.js")
  var WallStreetSource = require("./sources/wallstreet.js")
  var WeixinSource = require("./sources/weixin.js")
  var Get100ppiSource = require("./sources/100ppi.js")
  var GetChinaCefNews = require("./sources/chinacef.js")
  var Q = require('q');

  function FinanceNewsCrawl() {
    this.db = new StockNewsDB();
  }

  FinanceNewsCrawl.prototype.WrapWeixinJob = function(f) {
    console.log("[updating weixin...]", f);
    return WeixinSource(this.db, this.cacheFolder, f);
  }

  FinanceNewsCrawl.prototype.Wrap100ppiJob = function(f) {
    console.log("[updating 100ppi...]", f);
    return Get100ppiSource(this.db, this.cacheFolder, f);
  }

  FinanceNewsCrawl.prototype.AllWeixinAccounts = function() {
    var weixinSources = util.getAllWeixinSources();

    var result = Q();
    var _this = this;
    weixinSources.forEach(function (f) {
      result = result.then(() => _this.WrapWeixinJob(f));
    });
    return result;
  }

  FinanceNewsCrawl.prototype.All100ppiSources = function() {
    var ppiSources = util.getSourcesByType("100ppi");

    var result = Q();
    var _this = this;
    ppiSources.forEach(function (f) {
      result = result.then(() => _this.Wrap100ppiJob(f));
    });
    return result;
  }

  function successJob(result) {
    util.lastRun["date"] = (new Date()).getTime();
    util.lastRun["result"] = true;
    console.log(result);
  }

  function failedJob(err) {
    util.lastRun["date"] = (new Date()).getTime();
    util.lastRun["result"] = false;
    util.lastRun["verify"] = err.message;
    console.error(err);
  }

  FinanceNewsCrawl.prototype.run = function(theDate) {
    if (!theDate) {
      theDate = new Date();
    }
    util.lastRun = {startedate: theDate.getTime(), details: {}};
    var dayOfYear = theDate.getDOY().toString();
    this.cacheFolder = path.join("caches", theDate.getFullYear().toString(), dayOfYear);
    var _this = this;
    util.mkdirpSync(this.cacheFolder);
    this.db.createIndex()
        .then(() => WallStreetSource(_this.db, _this.cacheFolder))
        .then(() => GetChinaCefNews(_this.db, _this.cacheFolder))
        .then(() => _this.All100ppiSources())
        .then(() => _this.AllWeixinAccounts())
        .then(successJob, failedJob);
  }
  if (typeof window !== 'undefined') {
    window.FinanceNewsCrawl = FinanceNewsCrawl;
  }

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = FinanceNewsCrawl;
  }
})();
