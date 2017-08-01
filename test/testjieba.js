var util = require('../utils.js');
var assert = require('assert');
var path = require('path');
var StockNewsDB = require("../stocknewsdb.js");
var nodejieba = require("nodejieba");

describe('test jieba', function() {
  it('test jieba word segment', function() {
    var result = nodejieba.cut("摘要：特朗普女婿库什纳今日发布声明称，承认在美国总统大选期间与其后与俄罗斯人进行了四次会面，但称这些会面不值一提，并否认曾勾结俄罗斯政府帮助特朗普赢得大选。库什纳发布声明后，美元指数小幅走高后回落，黄金波动不大。库什纳称最近一次与俄方的接触是在去年12月13日，当时他应俄罗斯驻美国大使Sergey Kislyak的要求与俄罗斯银行家Sergey Gorkov进行了会面，但并未与Gorkov有过商业讨论。", cut_all=false);
    console.log(result);
  });
});
