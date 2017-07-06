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
  var Q = require('q');

  function FinanceNewsCrawl() {
    this.db = new StockNewsDB()
  }

  FinanceNewsCrawl.prototype.WrapWeixinJob = function(f) {
    console.log("[updating...]", f);
    return WeixinSource(this.db, this.cacheFolder, f);
  }

  FinanceNewsCrawl.prototype.AllWeixinAccounts = function() {
    //海清FICC频道,金融行业网,莫尼塔宏观研究,莫尼塔研究,泽平宏观,中国金融四十人论坛,中国金融网,中国金融新闻网,中国金融杂志
    var weixinSources = ["cn-finance", "midou888_zx", "haiqing_FICC", "jrhycom", "cebmmacro",
      "CEBM_research", "zepinghongguan", "CHINAFINANCE40FORUM", "cfn-china", "FN_FinancialNews"];

    var result = Q();
    var _this = this;
    weixinSources.forEach(function (f) {
      result = result.then(() => _this.WrapWeixinJob(f));
    });
    return result;
  }

  FinanceNewsCrawl.prototype.run = function(theDate) {
    if (!theDate) {
      theDate = new Date();
    }
    var dayOfYear = theDate.getDOY().toString();
    this.cacheFolder = path.join("caches", theDate.getFullYear().toString(), dayOfYear);
    var _this = this;
    util.mkdirpSync(this.cacheFolder);
    this.db.createIndex()
        .then(() => WallStreetSource(_this.db, _this.cacheFolder))
        .then(() => _this.AllWeixinAccounts())
        .then(console.log, console.error);
  }
  if (typeof window !== 'undefined') {
    window.FinanceNewsCrawl = FinanceNewsCrawl;
  }

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = FinanceNewsCrawl;
  }
})();