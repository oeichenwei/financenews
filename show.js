'use strict';
(function() {
  var express = require('express');
  var app = express();
  var StockNewsDB = require("./stocknewsdb.js")
  var db = new StockNewsDB()
  var session = require('express-session');
  var bodyParser = require('body-parser');
  var util = require("./utils.js");
  var fs = require("fs");
  var request = require("request");
  var globalCrawler;
  var skipAuth = false;
  var simpleRate = require('./tagging/simplerating.js');

  app.use(bodyParser.urlencoded({extended: true}));
  app.use(bodyParser.json());
  app.use(session({secret: 'Pa$$lhm20170625',
                   saveUninitialized: false,
                   resave: true}));

  function urlNeedNotAuthtication(url) {
    if (skipAuth) {
      return true;
    }

    return (url.indexOf('login') != -1 || url.indexOf('css') != -1 || url.indexOf('jquery') != -1);
  }

  app.use(function(req, res, next){
    let sess = req.session;
    //console.log("authentication hook:", sess);
    if(!sess.email && !urlNeedNotAuthtication(req.url)) {
      //console.log("query, not login")
      res.redirect('login.html');
      return;
    }
    next();
  });

  app.use(express.static('static'));

  app.get('/query', function (req, res) {
    console.log("query: count=", req.query.count, ", date=", req.query.date, ", source=", req.query.sourceId)
    var recvDate = undefined
    if (req.query.date) {
      recvDate = parseInt(req.query.date)
    }
    var type = "next"
    if (req.query.type) {
      type = req.query.type
    }
    db.listArticles(parseInt(req.query.count), recvDate, type, req.query.sourceId, req.query.category).then( (docs) => {
      res.send(docs);
    }, console.error);
  });

  app.get('/getkeyword', function (req, res) {
    var keywordsStr = fs.readFileSync("./keywords.json");
    res.send(JSON.parse(keywordsStr));
  });

  app.put('/setkeyword', function (req, res) {
    console.log(req.body);
    fs.writeFileSync("./keywords.json",JSON.stringify(req.body));
    simpleRate.initalize();
    db.findRecentUnratedDocs(1, true).then((docs) =>{
      console.log("findRecentUnratedDocs, length=", docs.length);
      return db.resaveDocRecursively(docs);
    }).then((result) => res.send("success"), res.send);
  });

  app.get('/querybyscore', function (req, res) {
    console.log("query: count=", req.query.count, ", date=", req.query.date, ", source=", req.query.sourceId)
    var recvDate = undefined
    if (req.query.date) {
      recvDate = parseInt(req.query.date)
    }
    var skip = 0
    if (req.query.skip) {
      skip = parseInt(req.query.skip)
    }
    db.listArticlesOrderByScore(skip, parseInt(req.query.count), recvDate, req.query.sourceId, req.query.category).then( (docs) => {
      res.send(docs);
    }, console.error);
  });

  app.post('/login', function(req, res) {
    let sess = req.session;
    //console.log("login,", req.body);
    if (req.body.username == "admin" && (req.body.passwd == "Pa$$lhm" || req.body.passwd == "passlhm")) {
      sess.email = req.body.username;
      sess.cookie.maxAge = 3600000*24*7; //session expires in 7 days
      res.end('done');
    }
    res.end("Login Failure");
  });

  app.get('/status', function (req, res) {
    res.send(util.lastRun);
  });

  app.post('/doverify', function (req, res) {
    console.log("doverify, post", req.body.verifycode);
    var verifyCodeUrl = "https://mp.weixin.qq.com/mp/verifycode";
    util.postForm(verifyCodeUrl, {cert: util.randomChallenge, input: req.body.verifycode})
        .then((obj) => {
          obj = JSON.parse(obj);
          console.log(obj);
          if (obj["ret"] == 0) {
            globalCrawler();
            res.redirect('/');
          } else {
            res.redirect('/verify');
          }
        });
  });

  app.post('/verifysogou', function (req, res) {
    console.log("verifysogou, post", req.body.verifycode);
    var verifyCodeUrl = "http://weixin.sogou.com/antispider/thank.php";
    var options = {
      c: req.body.verifycode,
      r: "%2Fweixin%3Ftype%3D1%26s_from%3Dinput%26query%3Dcn-finance%26ie%3Dutf8%26_sug_%3Dn%26_sug_type_%3D",
      v: "5"
    }
    util.postForm(verifyCodeUrl, options)
        .then((obj) => {
          obj = JSON.parse(obj);
          console.log(obj);
          if (obj["code"] == 0) {
            delete util.sogouChallenge;
            var newCookie = request.cookie('SNUID=' + obj["id"]);
            util.cookie.setCookie(newCookie, "http://weixin.sogou.com/weixin");
            var successCookie = request.cookie('seccodeRight=success');
            util.cookie.setCookie(successCookie, "http://weixin.sogou.com/weixin");
            var suvCookie = request.cookie('SUV=' + 1E3*(new Date()).getTime()+Math.round(1E3*Math.random()));
            util.cookie.setCookie(suvCookie, "http://weixin.sogou.com/weixin");

            globalCrawler();
            res.redirect('/');
          } else {
            res.redirect('/verify');
          }
        });
  });

  app.get('/verify', function (req, res) {
    util.VerifyWeixinCode().then(function(aa) {
      if (aa instanceof Error) {
        console.log(aa);
        res.redirect('/spider');
      }
      else {
        var result;
        if (util.sogouChallenge) {
          result = fs.readFileSync("./static/do_verify_sogou.html", "utf-8");
        } else {
          result = fs.readFileSync("./static/do_verify.html", "utf-8");
        }
        res.send(result);
      }
    });
  });

  app.get('/spider', function (req, res) {
    console.log("spider, argument=", req.query.clean);
    globalCrawler(req.query.clean);
    res.redirect("/");
  });

  app.get('/score', function (req, res) {
    console.log("score, uri=", req.query.uri, ", recvDate=", req.query.recvDate, ", score=", req.query.score);
    db.updateScore(req.query.uri, parseInt(req.query.recvDate), parseInt(req.query.score)).then((result) => res.send(result));
  });

  app.get('/customrate', function (req, res) {
    console.log("customrate");
    var recentresult = JSON.parse(fs.readFileSync("./caches/customrate_result.json"));
    var forDisplay = {}
    var firstDate = -1;
    for (var theDate in recentresult) {
      var now = Date.parse(theDate);
      if (firstDate < 0 || now < firstDate) {
        firstDate = now;
      }
    }
    var theDate = new Date();
    var today = (new Date(theDate.getFullYear(), theDate.getMonth(), theDate.getDate(), 0, 0, 0)).getTime();
    var count = (today - firstDate) / (24*3600000);
	if(theDate.getHours() >= 17)
	{
		count = count + 1;
		today = today + 24*3600000;
	}

    forDisplay["firstDate"] = firstDate / 1000;
    forDisplay["days"] = count;
    forDisplay["data"] = [];

    for (var i = firstDate; i <= today; i += (24*3600000)) {
      var readableKey = (new Date(i)).toLocaleDateString();
      var sense = 0;
      if (recentresult[readableKey]) {
        sense = Math.round(recentresult[readableKey].sense * 1000);
      }
      forDisplay["data"].push(sense);
    }
    res.send(forDisplay);
  });

  function WebRender() {
  }

  WebRender.prototype.run = function (listenPort, crawler, skipauth) {
    globalCrawler = crawler;
    skipAuth = skipauth;
    var server = app.listen(listenPort, function () {
      var host = server.address().address;
      var port = server.address().port;
      console.log('Example app listening at http://%s:%s', host, port);
    });
  }

  if (typeof window !== 'undefined') {
    window.WebRender = WebRender;
  }

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = WebRender;
  }
})();
//http://www.expressjs.com.cn/starter/hello-world.html
//服务器地址： 106.15.180.230  服务器密码：
