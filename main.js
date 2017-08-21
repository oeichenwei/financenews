var ArgumentParser = require('argparse').ArgumentParser;
var parser = new ArgumentParser({
  version: '0.0.1',
  addHelp:true,
  description: 'Financial News Crawler'
});

parser.addArgument(
  [ '-p', '--port' ],
  {
    action: "store",
    type: 'int',
    defaultValue: 80,
    help: 'web service listen port'
  }
);

parser.addArgument(
  [ '-s', '--skip' ],
  {
    action: "storeTrue",
    defaultValue: false,
    help: 'skip the initial crawling job'
  }
);

parser.addArgument(
  [ '--skipauth' ],
  {
    action: "storeTrue",
    defaultValue: false,
    help: 'skip the authentication'
  }
);

var args = parser.parseArgs()

var FinanceNewsCrawl = require("./financecrawl.js");
var crawler = new FinanceNewsCrawl();
var schedule = require('node-schedule');
var util = require('./utils.js');
var path = require('path');

var spiderJob = function(cleanOld) {
  var theDate = new Date();
  if (cleanOld) {
    var dayOfYear = theDate.getDOY().toString();
    var cacheFolder = path.join("caches", theDate.getFullYear().toString(), dayOfYear);
    util.deleteFolderRecursive(cacheFolder);
  }
  crawler.run(theDate);
}

var job = function() {
  //spiderJob(true);
}

var rule = new schedule.RecurrenceRule();
rule.hour = [8, 12, 20];
rule.minute = 0;
schedule.scheduleJob(rule, job);

if (!args.skip) {
  crawler.run();
}

var WebRender = require("./show.js");
var webService = new WebRender();
webService.run(args.port, spiderJob, args.skipauth);
