var express = require('express');
var router = express.Router();
var handler = require('./dbhandler.js');     // 操作数据库的模块
var ObjectID = require('mongodb').ObjectID;  // 处理 MongoDB 数据库中数据主键的模块
var crypto = require('crypto');              // 加密模块

// 写管理员列表中请求管理员权限的功能
router.get('/CourseHandler', function (req, res) {
 if (req.query.action == 'getpower') { // 如果是true就是管理员的权限请求的接口
   handler(req, res, "powers", null, function (data) { // 调 handler 查询数据库的函数来查询权限数据并返回给客户端查询的结果
     if (data.length == 0) {
       var obj = {
         err: "获取权限失败",
         data: data
       };
       var str = JSON.stringify(obj);
       res.end(str);
     } else {
       var obj = { 
        success: "成功",
        data: data
       };
       var str = JSON.stringify(obj);
        res.end(str);
     }
   });
 } else {
    res.end('{"err":"抱歉，CourseHandler 下无此路由"}');
 }
});
