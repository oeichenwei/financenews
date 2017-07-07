var StockNewsDB = require("./stocknewsdb.js")
var allSources = ["wallstreet", "cn-finance", "haiqing_FICC", "jrhycom",
      "cebmmacro",  "CEBM_research", "zepinghongguan", "CHINAFINANCE40FORUM",
      "cfn-china", "FN_FinancialNews", "midou888_zx"];
var Q = require('q');

function updateExistingRecords(){
  var result = Q();
  var db = new StockNewsDB();
  allSources.forEach(function (f) {
    result = result.then(() => db.updateCategory(f));
  });
  return result;
}

updateExistingRecords().then(console.log, console.error);
