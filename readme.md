### How to do custom rating

1. 如何执行更新？
  在命令行切换到目录`C:\financenews\crawler`，执行命令`node update.js --days 2` 这个就对最近2天的文章进行重新rating。执行的结果保存在`C:\financenews\crawler\caches\customrate_result.json`。以下是一个样例：

  ```
  {
  	"2017-9-10": {
  		"pos": 9300,
  		"neg": 2980,
  		"sense": true
  	},
  	"2017-9-9": {
  		"pos": 0,
  		"neg": 0,
  		"sense": false
  	}
  }
  ```

2. 如何修改算法？
  算法位于文件`C:\financenews\crawler\tagging\customrating.js`，主要需要修改两个函数：`rateArticle`(对一篇文章进行评价)和`calculateDailyResult`（对一天的结果进行汇总）。里面有实现一个最简单的算法。
3. 如何进行单元测试
  单元测试的文件在`C:\financenews\crawler\tagging\testrating.js`，如果想针对某个文章进行测试，可以随时把文章拷贝进去，替换掉当前的测试字符串，然后进行单篇的测试。运行测试的方法是`npm test -- -g custom`

### How to install MongoDB as service

```
mongod --logpath "C:\financenews\mongodb\logs\logs.txt" --logappend --dbpath "C:\financenews\mongodb\data" --directoryperdb --serviceName "MongoDB" --serviceDisplayName "MongoDB" --install
```
