/*  
 * 1、引入相关的模块
 * 2、接口路由
 */
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

// 管理员列表中添加管理员的功能
router.post('/AdminLoginAndRegHandler', function (req, res) {
  if (req.query.action == 'add') {
    req.query.action = 'show'
    handler(req, res, "Administor", null, function (arr) {
      var md5 = crypto.createHash('md5');
      //组织用户信息并作一些校验
      var userInfos = {};
      userInfos.createAt = new Date();
      userInfos.isdelete = /^fcgl/.test(req.body.turename) ? false : true;
      userInfos.password = md5.update(req.body.password).digest('base64');
      userInfos.phone = /^1\d{10}$/.test(parseInt(req.body.phone)) ? req.body.phone : 'false';
      userInfos.power = req.body.power;
      userInfos.powerCode = req.body.power == "系统管理员" ? 1 : 2;
      userInfos.success = "成功";
      userInfos.tokenId = arr.length + 1;
      userInfos.upDateAt = new Date();
      userInfos.userName = req.body.userName == "" ? 'false' : req.body.userName;
      userInfos.turename = req.body.turename == "" ? 'false' : req.body.turename;
      req.query.action = 'add'
      if (userInfos.phone != 'false' && userInfos.userName != 'false' && userInfos.turename != 'false') {
        handler(req, res, "Administor", userInfos, function (data) {
         //console.log(data);
          if (data.length == 0) {
            res.end('{"err":"抱歉，添加失败"}');
          } else {
            res.end('{"success":"注册成功"}');
          }
        });
      } else {
        res.end('{"err":"抱歉，添加失败"}');
      }
    });
  } else {
    res.end('{"err":"抱歉，POST AdminLoginAndRegHandler 下无此路由"}');
  }
});

//管理员列表中查询和分页的功能