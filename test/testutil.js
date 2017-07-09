var util = require('../utils.js');
var assert = require('assert');

describe('Util', function() {
  describe('category', function() {
    it('check category is correct', function() {
      assert.equal(true, util.isGeneral("wallstreet"));
      assert.equal(false, util.isGeneral("sciplas"));
      assert.equal(false, util.isGeneral("midou888_zx"));
    });

    it('check name is correct', function() {
      assert.equal("华尔街", util.getFriendlyName("wallstreet"));
      assert.equal("卓创塑料", util.getFriendlyName("sciplas"));
      assert.equal("米斗资讯", util.getFriendlyName("midou888_zx"));
    });

    it('check all weixin sources are enumerated', function() {
      let allWeixinSources = util.getAllWeixinSources();
      let testVector = ["cn-finance", "haiqing_FICC", "jrhycom", "cebmmacro",
        "CEBM_research", "zepinghongguan", "CHINAFINANCE40FORUM", "cfn-china", "FN_FinancialNews",
        "midou888_zx", "qihuozhoukan", "gh_ae0f6dacaf22", "hedgechina", "hexun_futures",
        "gh_a16e4bca4323", "qhrb168", "elogic", "jydmhg315", "langeweixin", "gh_4a0f4b50dd80",
        "nhqhscfzb", "nmghgw", "cjshcce", "puoketrader", "ykxj123", "v_breezes",
        "Wanhua_Petrochemical", "Mysteel-shgl", "erds4888", "ydqhjy", "zsqhyjs",
        "zslsd_", "cncotton", "CISA_chinaisa", "CCAON-lvjian", "zlqh-yjy", "macrocs",
        "zhuochuangsteel", "sciplas"];
      testVector.forEach(function(item) {
        assert.equal(true, allWeixinSources.includes(item));
      });
      assert.equal(testVector.length, allWeixinSources.length);
    });
  });
});
