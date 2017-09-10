var ArgumentParser = require('argparse').ArgumentParser;
var parser = new ArgumentParser({
  version: '0.0.1',
  addHelp:true,
  description: 'Update the financial news with rating'
});

parser.addArgument(
  [ '-d', '--days' ],
  {
    action: "store",
    type: 'int',
    defaultValue: 1,
    help: 'update how many days records'
  }
);

parser.addArgument(
  [ '-t', '--test' ],
  {
    action: "storeTrue",
    defaultValue: false,
    help: 'test update, it will always update recent 10 records'
  }
);

parser.addArgument(
  [ '-k', '--kind' ],
  {
    action: "store",
    help: 'what kind of algorithm'
  }
);

var args = parser.parseArgs()
var StockNewsDB = require("./stocknewsdb.js")
var CustomRating = require("./tagging/customrating.js")
var path = require('path');

var db = new StockNewsDB();
function updateSimpleRating(days) {
  db.findRecentUnratedDocs(days, true).then((docs) =>{
    console.log("findRecentUnratedDocs, length=", docs.length);
    db.resaveDocRecursively(docs);
  }).then(console.log, console.error);
}

if (args.kind == "simple") {
  updateSimpleRating(args.days);
} else {
  var customRating = new CustomRating();

  var theDate = new Date();
  var dayOfYear = theDate.getDOY().toString();
  var outputFile = path.join("caches", "customrate_result.json");
  customRating.run(args.days, db, outputFile);
}
