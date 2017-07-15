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
      var result;
      if (util.sogouChallenge) {
        result = fs.readFileSync("./static/do_verify_sogou.html", "utf-8");
      } else {
        result = fs.readFileSync("./static/do_verify.html", "utf-8");
      }
      res.send(result);
    });
  });

  app.get('/spider', function (req, res) {
    globalCrawler();
    res.redirect("/");
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
