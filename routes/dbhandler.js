var mongo=require("mongodb");               // @3.0.1
var assert = require('assert');             // 做验证的模块    assert 模块用来做断言，如果表达式不符合预期，就抛出一个错误；
var MongoClient = mongo.MongoClient;        // 创建 mongodb 的客户端
var Urls = 'mongodb://localhost:27017/administor';// 客户端的地址

/*  
 * 配置操作数据库的主要方法:
 */
//add 一条数据
var add = function(db,collections,selector,fn){
 var collection = db.collection(collections);
 collection.insertMany([selector],function(err,result){  // mongodb: Collection Methods
   assert.equal(err,null);  // node
   fn(result);
   db.close();
 });
}
//delete
var deletes = function(db,collections,selector,fn){
 var collection = db.collection(collections);
 collection.deleteOne(selector,function(err,result){
   assert.equal(err,null);
   assert.equal(1,result.result.n);
   fn(result);
   db.close();
 });
};
//find
var find = function(db,collections,selector,fn){
 var collection = db.collection(collections);
 collection.find(selector).toArray(function(err,docs){
   assert.equal(err,null); 
   fn(docs);
   db.close();
 });
}
//update
var updates = function(db,collections,selector,fn){
 var collection = db.collection(collections);
 console.log(selector);
 collection.updateOne(selector[0],selector[1],function(err,result){
   assert.equal(err,null);
   assert.equal(1,result.result.n);
   fn(result);
   db.close();
 });
}

/*  
 * 声明一个操作 mongodb 数据库的方法类别对象存储操作增删改查方法的函数表达式名称。
 * 在主逻辑函数中使用，通过 req.query.aciton 来确定用哪个方法。
 * 用 module.exports 来暴露操作 mongodb 数据库的主逻辑函数，里面传入的参数如上面参数说明所示。
 */
//操作 mongodb 数据库的方法类别对象
var methodType = {
 login:find,
 show:find,
 add:add,
 getpower:find,
 update:updates,
 delete:deletes,  
 updatepass:updates,
 adduser:add,
 usershow:find,
 getcategory:find,
 getcourse:find,
 find:find,
 state:find,
 top:find,
 AddDirectory:find,
 updateDirectory:updates,
 deleteDirectory:deletes,
 showlist:find,
 showdir:find
};
//主逻辑
/**
@param {object} [req] request 对象
@param {object} [res] response 对象
@param {string} [collections] 操作的集合
@param {json} [selector] 操作的字符串
@param {function} [fn] 回调函数
*/
module.exports = function(req, res, collections, selector, fn){
  MongoClient.connect(Urls, function(err, db) {               //客户端链接数据库
    assert.equal(null, err);                                  //做校验，判断 err 是否为一个空对象
    console.log("Connected correctly to server");
    //所有执行的主函数
    methodType[req.query.action](db, collections, selector, fn);   
    db.close();    //关闭数据库
  });
};

/*
录入管理员的权限
//在 mongodb 中使用项目中的 administor 数据库
use administor
//在 administor 数据库中为 powers 集合添加两条数据文档，如下
db.powers.insert({"power":"系统管理员","powerCode":1}))
db.powers.insert({"power":"课程管理员","powerCode":2})
注意：所有与 MongoDB 数据库有交互的功能，都必须在 MongoDB 数据库启动后执行，否
则会报错。
*/