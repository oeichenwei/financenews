'use strict';
(function() {
  var express = require('express');
  var app = express();
  var StockNewsDB = require("./stocknewsdb.js")
  var db = new StockNewsDB()
  var session = require('express-session');
  var bodyParser = require('body-parser');

  app.use(bodyParser.urlencoded({extended: true}));
  app.use(bodyParser.json());
  app.use(session({secret: 'Pa$$lhm20170625',
                   saveUninitialized: false,
                   resave: true}));

  function urlNeedNotAuthtication(url) {
    return (url.indexOf('login') != -1 || url.indexOf('css') != -1 || url.indexOf('jquery') != -1);
  }

  app.use(function(req, res, next){
    let sess = req.session;
    //console.log("authentication hook:", sess);
    if(!sess.email && !urlNeedNotAuthtication(req.url)) {
      console.log("query, not login")
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
    db.listArticles(parseInt(req.query.count), recvDate, type, req.query.sourceId).then( (docs) => {
      res.send(docs);
    }, console.error);
  });

  app.post('/login', function(req, res) {
    let sess = req.session;
    console.log("login,", req.body);
    if (req.body.username == "admin" && req.body.passwd == "Pa$$lhm") {
      sess.email = req.body.username;
      sess.cookie.maxAge = 3600000*24*7; //session expires in 7 days
      res.end('done');
    }
    res.end("Login Failure");
  });

  function WebRender() {
  }

  WebRender.prototype.run = function (listenPort) {
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