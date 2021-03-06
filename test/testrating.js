var rating = require('../tagging/simplerating.js');
var CustomRating = require('../tagging/customrating.js');
var path = require('path');
var StockNewsDB = require("../stocknewsdb.js");
var assert = require('assert');
var Q = require('q');

describe('test rating', function() {
  var teststring = `
  <p>美联储当前正在举行为期两天的货币政策会议，并将在北京时间周四（7月27日）02:00公布决议，外界普遍预测其将维持政策不变。据41位经济学家参与的BBG调查结果显示，美联储将在9月宣布缩减资产负债表时间表，在12月再次上调利率。多家投行认为美联储将表示会尽快展开缩表，并预计决议不会对美元产生影响。</p><p>另外，虽然周二（7月25日）黄金市场出现了一些回落，但瑞银和摩根大通依然表示看好黄金，认为市场的不确定性是金价的一大支撑。</p><h2>美银美林：美联储或表示将尽快缩表，决议料对美元无甚影响</h2><p>美银美林（BofAML）周二指出，预计美联储会在7月会议上将发出强烈信号：将在9月会议上宣布资产负债表正常化。<br></p><p>美银指出，<strong>美国联邦公开市场委员会（FOMC）很有可能调整声明，以加强对资产负债表正常化的承诺，但会对低通胀给予更多关注。具体来说，预计FOMC声明将指出会尽快展开缩表进程，这就意味着FOMC将在9月份的会议上宣布缩表。另外，预计FOMC将强调近期通胀疲软。</strong>该行称，这些潜在语言变化意味着FOMC会更加谨慎对待未来加息，但也认为FOMC仍会坚持缩减资产负债表。</p><p>另外，美银并不认为此次会议会对美元产生太大影响，没有新闻发布会的决议对市场的影响通常十分有限和短暂，该行预计今年秋季将会有更多关于缩表和再加息的相关细节信息出现。当前市场普遍达成的共识也是：7月决议将不会对美元产生影响，最近的美元走势主要是受其他事件影响，例如之前的欧洲央行论调，经济数据和风险情绪。<br></p><p>美银还表示，<strong>会继续关注美元走势，直到出现反向投资信号。</strong></p><p><strong><img src="https://wpimg.wallstcn.com/9bd4fba8-c875-4d86-8d93-2c642bd28705.png" data-wscntype="image" data-wscnh="560" data-wscnw="896" class="wscnph" data-mce-src="https://wpimg.wallstcn.com/9bd4fba8-c875-4d86-8d93-2c642bd28705.png"></strong></p><div style="text-align: center;" data-mce-style="text-align: center;"><a href="https://www.ig.com/zh/create-account?cx_aid=38363&amp;cx_us=38363_407834&amp;cx_pg=Leveraged&amp;cx_cid=7595&amp;utm_campaign=link" data-mce-href="https://www.ig.com/zh/create-account?cx_aid=38363&amp;cx_us=38363_407834&amp;cx_pg=Leveraged&amp;cx_cid=7595&amp;utm_campaign=link">点此在全球最大CFD券商IG交易“美元”</a></div><h2>高盛：美联储料暗示9月启动缩表 10月开始实施</h2><p>高盛近日表示，预计本次FOMC会议不会出现任何政策变动，政策声明的措辞也不会有很大变化，可能<strong>会加强对充分就业的描述，但同时会承认通胀进一步下滑。</strong><br></p><p>此外，该行指出，<strong>声明可能承认缩表日程近在咫尺，仍然预计美联储在9月宣布开始缩表，10月开始实施。9月和11月加息概率为5%，12月加息概率为50%，今年至少加息三次的概率为60%。</strong><br></p><p>高盛经济学家Daan Struyven在报告中写道，美联储资产负债表可能萎缩到GDP的13.4%左右（相当于现在的2.6万亿美元，预测2021年达到3万亿美元），拉高美国10年期国债收益率今明两年各上升20和15个基点，2019-2021年期间每年10个基点。</p><h2>法农：美联储料将有两大显著变化</h2><p>法国农业信贷银行周二指出，尽管周四的FOMC会议不会公布新的经济预期，也不会举行记者会，但此次声明可能会发生两个显著变化：<br></p><blockquote><p>首先，鉴于近期数据令人失望，且美联储主席耶伦在上周的证词中暗示有所疑虑，<strong>声明可能会进一步强调，其正密切关注通胀进展。</strong><br></p><p>其次，声明可能也会表明资产负债表计划将于9月宣布，<strong>可能会重申“相对较快”这一指向。</strong><br></p></blockquote><p>因此，这两大变化可能会在某种程度上相互抵消其对美元的影响。</p><h2>BTMU：欧元升值太快 欧央行要警惕了！</h2><p>东京三菱日联银行（BTMU）指出，过去三个月以<strong>来欧元大幅升值，年内兑美元的涨势扩大至逾10%。</strong>如持续下去，可能会愈发变成欧洲央行的政策担忧，其将妨碍欧元区未来几年的经济增长和通胀前景。<br></p><p><strong>欧元区7月PMI数据弱于预期，释放出了一个试探性的警告信号。综合PMI指数已经连续三个月未能增加，这与欧元近期的大幅升值恰好行成鲜明对比。7月企业信心指数的进一步回调尤其体现在制造业领域，其对欧元升值更加敏感。</strong><br></p><p>鉴于潜在通胀仍远低于欧央行的目标，三菱日联认为欧央行可能会对“欧元走强对通缩的潜在影响”保持格外的警惕。</p><h2>丹斯克：欧/美短期动能不足 长期仍建议逢低买入</h2><p>丹斯克银行（Danske Bank）周三（7月26日）指出，已经上调其欧元/美元短期预期至1.17，这反映出欧元/美元进一步走高是有可能持续的，但预期短期动能会有所消退，因技术指标、短期估值和仓位有些过度。<br></p><p>从基本面来讲，丹斯克认为欧元/美元仍被低估，而投资者应关注欧元/美元的继续走高。<strong>欧元/美元任何的下行料将被证明是短暂的，依旧坚持逢低买入。</strong><br></p><p><strong>长期来看，丹斯克预期欧元/美元将受基本面支持走高，此外美联储和欧洲央行政策的分化将会缩窄，该汇价12个月目标指向1.22。</strong></p><p><strong><img src="https://wpimg.wallstcn.com/1d60e5dd-d65d-4e31-aa27-f5110e6bd14b.png" data-wscntype="image" data-wscnh="559" data-wscnw="897" data-mce-src="https://wpimg.wallstcn.com/1d60e5dd-d65d-4e31-aa27-f5110e6bd14b.png"></strong></p><p style="text-align: center;" data-mce-style="text-align: center;"><a href="https://www.ig.com/zh/create-account?cx_aid=38363&amp;cx_us=38363_407834&amp;cx_pg=Leveraged&amp;cx_cid=7595&amp;utm_campaign=link" data-mce-href="https://www.ig.com/zh/create-account?cx_aid=38363&amp;cx_us=38363_407834&amp;cx_pg=Leveraged&amp;cx_cid=7595&amp;utm_campaign=link">点此在全球最大CFD券商IG交易“欧元”</a></p><p><strong>虽然周二(7月25日)黄金市场出现了一些回落，但瑞银和摩根大通依然表示看好黄金，认为市场的不确定性是金价的一大支撑。不过接下去，美联储利率决议的到来将成为市场焦点。</strong></p><h2>Think Markets：市场注意力转向美联储</h2><p>该机构分析师Naeem Aslam表示，特朗普政府带来的不确定性支撑着金价走高，但接下去市场的注意力将转向美联储利率决议。“由于这一次会后没有新闻发布会，因此我们预计不会为市场带来太大影响，但缩表的行动对金价将有影响，而一旦有过于鹰派的言论也会带来不确定性，利好黄金。”</p><h2>瑞银集团：对黄金依旧持建设性看法&nbsp;</h2><p>瑞银分析师表示，尽管利率上涨，股市涨势也仍在继续，但金价仍保持在目前的水平，这“令人鼓舞”，对黄金依旧持建设性看法。并且瑞银还预期印度的黄金消费在年底前或达到创纪录的新高。</p><h2>摩根大通：注意！未来几个月金价或提供买入良机</h2><p>摩根大通分析师Natasha Kanevawrote称，近期由于华盛顿政治不确定性升温，美元下跌以及美国通胀疲软的原因，金价持续走高。但该行目前并未建议买入黄金，也许未来几个月会出现买入的机会。</p><p><img src="https://wpimg.wallstcn.com/57131ab3-ea03-407b-9ee5-d29b46e10d11.png" data-wscntype="image" data-wscnh="555" data-wscnw="894" class="wscnph" data-mce-src="https://wpimg.wallstcn.com/57131ab3-ea03-407b-9ee5-d29b46e10d11.png"></p><p style="text-align: center;" data-mce-style="text-align: center;"><a href="https://www.ig.com/zh/create-account?cx_aid=38363&amp;cx_us=38363_407834&amp;cx_pg=Leveraged&amp;cx_cid=7595&amp;utm_campaign=link" data-mce-href="https://www.ig.com/zh/create-account?cx_aid=38363&amp;cx_us=38363_407834&amp;cx_pg=Leveraged&amp;cx_cid=7595&amp;utm_campaign=link">点此在全球最大CFD券商IG交易“黄金”</a></p>
  `;
  it('test simple rating algorithm', function() {
    return rating.rateOne(teststring).then((score) => assert.ok(score["score"] > 0));
  });

  it('test custom rating algorithm', function() {
    var deferred = Q.defer();
    var customRate = new CustomRating();
    require("jsdom").env("", function(err, window) {
      var $ = require("jquery")(window);
      var result = customRate.rate($, {"recvDate": 1504972679480, "content": teststring});
      console.log(result);
      assert(result["eval"]["pos"] > result["eval"]["neg"]);
      customRate.mapDailyResult(result);
      customRate.calculateDailyResult();
      deferred.resolve();
    });
    return deferred.promise;
  });
});
