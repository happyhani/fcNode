/*  
 * 1、引入相关的模块
 * 2、接口路由
 */
var express = require('express');
var router = express.Router();
var handler = require('./dbhandler.js');     // 操作数据库的模块
var ObjectID = require('mongodb').ObjectID;  // 处理 MongoDB 数据库中数据主键的模块
var crypto = require('crypto');              // 加密模块
//上传功能
var formidable = require('formidable');      // 用来处理客户端传过来的文件 
var fs = require('fs');                      // 用来处理删除后的视频文件


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
    req.query.action = 'show' // 让操作数据库的模块执行查询数据的操作所有的 用户信息
    handler(req, res, "Administor", null, function (arr) {
      var md5 = crypto.createHash('md5');
      //组织用户信息并作一些校验  客户端传过来的数据进行校验后赋值给 userInfos 对象
      // ps：userInfos 对象中的 key 值是 MongoDB 数据结构文档中系统人员列表 administors 集合中的字段， 用 户 的 tokenId 为 查 询 到 的 所 有 用 户 数 据 的 长 度 加 1 ， 管 理 员 的 密 码 要 通 过 crypto.createHash('md5')加密
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
      req.query.action = 'add' // 设置为‘add’。让操作数据库的模块执行添加数据的操作，根据数 据库操作的结果给客户端返回响应的数据
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
router.get('/AdminHandler', function (req, res) {
  // true 就为管理员列表中请求系统人员的数据或查询
  if (req.query.action == 'show') { 
    handler(req, res, "Administor", null, function (arr) {
      // req.query.searchText如果存在则是查询， 否则就是管理员信息的请求，设置相应的条件查询语句。从数据库查询数据并把结果发送给 客户端。
      var selector = !req.query.searchText ? { 
            tokenId: {
              $gt: arr.length - (parseInt(req.query.pageStart) * 3 - 3) - 3,
              $lte: arr.length - (parseInt(req.query.pageStart) * 3 - 3)
            }
          } : {turename: {$regex: '.*' + req.query.searchText + '.*', $options:'i'}};

      handler(req, res, "Administor", selector, function (data) {
        console.log(data);
        if (data.length == 0) {
          res.end('{"err":"抱歉，系统中查不到人员"}');
        } else {
          var obj = {
            data: {
              pageSize: 3,
              count: arr.length,
              list: data
            }
          }    
          var str = JSON.stringify(obj);
          res.end(str);
        }
      });
    });
  } else {
    res.end('{"err":"抱歉，GET AdminHandler 下无此路由"}');
  }
});
// 注意：由于我们把 isNullObj 函数写成了函数表达式，所以要把这个函数表达式放在 handler.js 加在模块后，所有的路径路由之前。

// 管理员列表中删除的功能
router.get('/AdminHandler', function (req, res) {
  if (req.query.action == 'show') {
    /*管理员列表的数据显示*/
    /*此处代码已省略*/
  } else if (req.query.action == 'delete') { //用户列表删除
    handler(req, res, "Administor", {tokenId: parseInt(req.query.tokenId), isdelete: true}, function (data) {
      if (data.result.n == 0) {
        res.end('{"err":"删除失败"}');
      } else {
        req.query.action = 'show';
        //获取 tokenId 大于当前 tokenId 的数据集，并迭代处理管理员列表的 tokenId
        handler(req, res, "Administor", {tokenId: {$gt:parseInt(req.query.tokenId)}}, function (da) {
          //运行迭代处理删除后的系统管理员各人员的 tokenId 的函数
          recUpdate(req, res, "Administor", da);
        });
      }
    });
  } else {
    /*其他内容*/
  }
});

/*迭代处理删除后的系统管理员各人员的 tokenId 的函数*/
/*
 * 管理员列表中删除管理员功能不能直接在删除数据后就给客户端返回结果，
 * 需要在删除后处理一下大于删除数据的 tokenId 的数据，让它的 tokenId 都减 1，
 * 防止在添加系统管理员时出现 tokenId 相同的情况。
 * 注意：由于我们把 recUpdate 函数写成了函数表达式，所以要把这个函数表达式放在handler.js 加载模块后，所有的路径路由之前。
 */
var recUpdate = function (req, res, collections, data) {
  if (data.length === 0) {
    res.end('{"success":"删除成功"}');
  } else {
    var selectors = [
      {"userName": data[0].userName},
      {
        $set: {
          "tokenId": data[0].tokenId - 1
        }
      }
    ];
    req.query.action = 'update';
    handler(req, res, collections, selectors, function (data) {
      data.shift();
      if (data.length != 0) {
        //console.log(data);
        recUpdate(req, res, collections, data);
      } else {
        res.end('{"success":"更新成功"}');
      }
    });
  }
}

// 管理员列表中编辑管理员信息的功能
/* 
 * 设置数据库的操作符 selectors 变量保存查询条件和更新内容，
 * 把操作符 selectors 传入到 handler 函数中编写回调函数来给客服端返回操作后的结果。
 */
router.post('/AdminHandler', function (req, res) {
	if (req.query.action == 'update') {
		var selectors = [
      {"tokenId": parseInt(req.body.tokenId)},
      {
        $set: {
          "userName": req.body.userName,
          "turename": req.body.turename,
          "phone": req.body.phone,
          "power": req.body.power,
          "upDateAt": new Date()
        }
      }
    ];
    handler(req, res, "Administor", selectors, function (data) {
    	if (data.length == 0) {
    		res.end('{"err": "抱歉，更新失败"}');
    	} else {
    		res.end('{"success": "更新成功"}');
    	}
    })
	} else {
    res.end('{"err": "抱歉，POST,AdminHandler 无此路由"}');
	}
});

// 实现登录、退出、修改密码、请求个人信息等功能
// 实现验证码的请求和匹配验证码的功能
// 客户端获取验证码字符及校验验证码的功能
router.get('/AdminLoginAndRegHandler', function (req, res) {
	if (req.query.action == "verification") {
		var randomNum = function (min, max) { // 生成随机数  min <= i < max
			return Math.floor(Math.random() * (max - min) + min);
		};
		var str = 'ABCEFGHJKLMNPQRSTWXY123456789';
		var returnStr = '';
		for (var i = 0; i < 4; i++) {
			var txt = str[randomNum(0, str.length)];
			returnStr += txt;
		}
    var newUser = newUser({
      name: "",
      password: "",
      id: "",
      veri: returnStr
    });
    req.session.user = newUser; // req.session就是在服务器端记录对话的session对象
    res.end('{"success": "true", "data": "' + returnStr + '"}');
	} else if (req.query.action === "checkVerification") {
	  if (req.query.veri === req.session.user.veri) { // 客户端传过来的验证码和session做匹配，然后返回结果
	  	res.end('{"success": "验证码正确"}');
	  } else {
	  	res.end('{"success": "验证码错误"}');
	  }
	}
	else {
    res.end('{"err": "抱歉，GET,AdminLoginAndRegHandler 无此路由"}');
	}
});
// 用户对象的构造函数
function newUser (user) {
	this.id = user.id;
	this.name = user.name;
	this.password = user.password;
	this.veri = user.veri;
};

// 用户登录的功能
/*
 * 把客户端传过来的用户名和密码在数据库中进行匹配，
 * 如果匹配成功就把该用户的信息储存到 req.session.user 对象中，然后向客户端发送结果。
 * 否则直接返回失败的结果
 */
router.post('/AdminLoginAndRegHandler', function (req, res) {
	if (req.query.action == 'login') {
		var md5 = crypto.createHash('md5');
		var password = md5.update(req.body.password).digest('base64');
		handler(req, res, "Administor", {userName: req.body.userName, password: password}, function (data) {
	    if (data.length == 0) {
	    	res.end('{"err": "抱歉，系统中并无该用户，如有需要，请向管理员申请"}');
	    } else if (data[0].password = password) {
	      req.session.user.name = req.body.userName;
        req.session.user.password = password;
        req.session.user.id = data[0]._id;
        res.end('{"success":"true"}');
	    }
    });
	} else {
	  res.end('{"err":"抱歉，POST AdminLoginAndRegHandler 下无此路由"}');
	}
});

// (4) 编写请求个人信息的功能
router.post('/AdminHandler', function (req, res) {
	if (/* 其他接口 */) {
		/*其他请求接口内容*/
	} else if (req.query.action == 'returnuserinfo') {
	  //登入后返回当前用户的详细信息
    req.query.action = 'find';
    //从 session 中拿去当前用户的在数据库中主键值
    var sessionId = new ObjectID(req.session.user.id);
    //console.log(sessionId);
    handler(req, res, "Administor", {"_id": sessionId}, function (data) {
    	if (data.length == 0 || data.length > 1) {
    		res.end('{"err": "抱歉，系统故障"}');
    	} else {
    	  var str = JSON.stringify(data[0]);
    	  res.end(str);
    	}
    });
	} else {
	  res.end('{"err":"抱歉，POST,AdminHandler 无此路由"}');
	}
});

// (5) 编写修改密码的功能
router.post('/AdminHandler', function (req, res) {
	if (/*其他接口*/) {
		/*请求其他接口*/
	} else if (req.query.action == 'updatepass') {
	  var md5 = crypto.createHash('md5');
	  var passwordMd5 = md5.update(req.body.userPwd).digest('base64');
	  // 判断原密码是否正确
	  if (req.session.user.password != passwordMd5) {
	  	res.end('{"err": "密码错误"}');
	  } else {
	    var md56 = crypto.createHash('md5');
	    var newPwd = req.session.user.password = md56.update(req.body.newPwd).digest('base64');
	    var selectors = [
        {"userName": req.session.user.name},
        {
          $set: {
            "password": newPwd,
            "upDateAt": new Date()
          }
        }
      ];
      // 新密码更新到数据库
      handler(req, res, "Administor", selectors, function (data) {
      	if (data.length == 0) {
      		res.end('{"err":"密码更新失败"}');
      	} else {
      	  res.end('{"success":"更新成功"}');
      	}
      });
	  }
	} else {
	  res.end('{"err":"抱歉，POST,AdminHandler 无此路由"}');
	}
});

// (6) 编写用户退出的功能
router.get('/AdminHandler', function (req, res) {
	if (/* 其他接口 */) {
		/* 其他请求 */
	} else if (req.query.action == 'quit') {
	  if (req.session.user) {
	  	req.session.user = {}; // 清空该客户端在服务器上设置的 session 值
	  }
	  res.end('{"success": "退出成功"}');
	} else {
	  res.end('{"err":"抱歉，GET AdminHandler 下无此路由"}');
	}
});

// 实现学员列表中的相关业务逻辑
// (1) 编写学员列表中学员的添加功能
/*
 * 添加学员跟添加管理员的流程是一样的，
 * 首先查询所有的学员数据，然后把客户端传过来的数据进行校验后赋值给 userInfos 对象（
 * ps：userInfos 对象中的 key 值是在 MongDB数据结构文档中的 studentList 集合中确定的），操作数据库进行数据的添加，根据数据库操作的结果给客户端返回响应的数据。
 */
router.post('/AdminHandler', function (req, res) {
	if (/*其他接口*/) {
		/* */
	} else if (req.query.action == 'adduser') {
	  req.query.action = 'usershow';
	  // 获取学员列表的数据总数
	  handler(req, res, "studentList", null, function (arr) {
	  	// 组织学员信息并做一些校验
	  	var userInfos = {};
	  	userInfos.createAt = new Date();
	  	userInfos.email = /^([a-zA-Z0-9]+[_|\_|\.]?)*[a-zA-Z0-9]+@([a-zA-Z0-9]+[_|\_|\.]?)*[a-zAZ0-9]+\.[a-zA-Z]{2,3}$/.test(req.body.addemail)
                        ? req.body.addemail : "数据格式不对"; 
      userInfos.isstate = false;
      userInfos.phone = /^1\d{10}$/.test(parseInt(req.body.addphone)) 
                        ? req.body.addphone : 'false';
      userInfos.success = "成功";
      userInfos.userPwd = "123456";
      userInfos.tokenId = arr.length + 1;
      userInfos.upDateAt = new Date();
      userInfos.userName = req.body.userName == "" ? 'false' : req.body.adduserName;
      req.query.action = 'adduser';
      if (userInfos.phone != 'false' && userInfos.userName != 'false' && userInfos.turename != 'false' && userInfos.email != "数据格式不对") {
        //增加操作
        handler(req, res, "studentList", userInfos, function (data) {
        //console.log(data);
          if (data.length == 0) {
            res.end('{"err":"抱歉，添加失败"}');
          } else {
            res.end('{"success":"添加成功"}');
          }
        });
      } else {
        res.end('{"err":"抱歉，数据格式有误，添加失败"}');
      }
	  });
	} else {
	  res.end('{"err":"抱歉，POST,AdminHandler 无此路由"}');
	}
});

// (2) 编写学员列表中分页和查询的功能
/*  
 * 首先查询所有学员信息的数据，为下面的分页做数据条数的准备。
 * 声明 selector 对象保存客户端传过来的搜索条件，根据不同的 if 判断给 selector 对象赋予相关的 key 和 value。
 * 利用 isNullObj 函数来判断 selector 对象是不是一个空对象，
 * 如果是一个空对象则客户端是请求分页数据，否则就是客户端的查询请求。
 * 设置相应 的条件查询语句。从数据库查询数据并把结果发送给客户端
 * 注意：判断对象是否为空的函数 isNullObj 我们写成了函数表达式，所以要把这个函数表达式放在 handler.js 加载模块后，所有的路径路由之前。
 */
router.post('/AdminHandler', function (req, res) {
	if (/*其他*/) {
		
	} else if (req.query.action == 'usershow') {
	  var selector = {};
	  if (req.body.userName) {
      selector.userName = {$regex: '.*' + req.body.userName + '.*'};
    }
    if (req.body.email) {
      selector.email = {$regex: '.*' + req.body.email + '.*'};
    }
    if (req.body.phone) {
      selector.phone = {$regex: '.*' + req.body.phone + '.*'};
    }
    //获取学员列表的数据总数
	  handler(req, res, 'studentList', null, function (arr) {
	  	if (isNullObj(selector)) {
        selector = {
          tokenId: {
            $gt: arr.length - (parseInt(req.body.pageStart) * 6 - 6) - 6,
            $lte: arr.length - (parseInt(req.body.pageStart) * 6 - 6)
          }
        };
      }
	  	// 查询数据库获取结果
	    handler(req, res, 'studentList', selector, function (data) {
	  	  var obj = {
	  	    data: {
	  	      pageSize: 6,
	  	      count: arr.length,
	  	      list: data
	  	    }
	  	  }
	  	  var str = JSON.stringify(obj);
	  	  res.end(str);
	    });
	  });
	} else {
	  res.end('{"err":"抱歉，POST,AdminHandler 无此路由"}');
	}
});
// 判断对象是否为空的函数
var isNullObj = function (obj) {
	for (var i in obj) {
		if (obj.hasOwnProperty(i)) {
			return false;
		}
		return true;
	}
}

// (3) 编写学员列表中对学员的冻结/解冻功能
/*
 * 首先根据客户端发送过来的学员的 tokenId 在数据库中查询该学员的信息，
 * 然后把该学员的状态值通过三目操作符取反后，写入数据库，根据操作数据库的结果给客户端返回数据。
 */
router.get('/AdminHandler', function (req, res) {
	if () {
		
	} else if (req.query.action == 'lockuser') { // 学员列表冻结
	  // 获取与tokenId对应的该条数据
	  req.query.action = 'show';
	  handler(req, res, "studentList", {tokenId: parseInt(req.query.tokenId)}, function (da) {
	  	req.query.action = 'update';
	  	var selectors = [
	  	  {tokenId: parseInt(req.query.tokenId)},
        {
          $set: {
            isstate: da[0].isstate ? false : true
          }
        }
	  	];
	  	// 切换当前字段isstate的状态
	  	handler(req, res ,"studentList", selectors, function(data){
	  	  if (data) {
          res.end('{"success":"操作成功"}');
        } else {
          res.end('{"err":"抱歉，冻结失败"}');
        }
	  	});
	  });
	} else {
	  res.end('{"err":"抱歉，GET AdminHandler 下无此路由"}');
	}
});

// 0901
// 设置视频上传的接口
/*
 * form.parse 方法会转换请求中所包含的表单数据,回调中三个参数的含义：
 * err 失败的信息，fields 表单中的字段信息，files 表单中 文件信息
 * 我们在这里没有进行文件类型的校验，所以在客户端上传任何类型的文件都会成功，有兴趣的同学可以做一下文件类型的校验。
 * 我们在课程添加封面处会对上传的图片的格式做校验。
 * 注意：form.uploadDir 中定义的文件保存路径要预先建好，否则上传时会报错
 */
router.post('/UpLoadVideoHandler', function (req, res) {
	var form = new formidable.IncomingForm();     // 创建 Formidable.IncomingForm 
	form.encoding = 'utf-8';                      // 设置表单域的编码
  form.uploadDir = "public/video/";             // 设置上传文件存放的文件夹，
  form.keepExtensions = true;                   // 传的文件保持原来的文件的扩展名
  form.maxFieldsSize = 100 * 1024 * 1024;       // 限制表单大小
  form.maxFields = 1000;                        // 设置可以转换多少查询字符串，默认为 1000
  // form.parse 方法会转换请求中所包含的表单数据 
  form.parse(req, function (error, fields, files) {
  	if (!error) {
  	  var obj = {
  	    cacheName: files[Object.getOwnPropertyNames(files)[0]].path,
  	    success: "成功"
  	  }
  	  var str = JSON.stringify(obj);
  	  res.end(str);
  	} else {
  	  var obj = {
  	    err: "上传失败"
  	  }
  	  var str = JSON.stringify(obj);
      res.end(str);
  	}
  });
});

// 实现视频列表中相关的功能
// (1) 编写视频列表中视频的添加功能
/*
 * 首先查询所有的视频数据，然后把客户端传过来的数据进行校验后赋值给videos对象
 *（ps： videos 对象中的 key 值是在 MongoDB 数据结构文档中的 videoList 集合中确定的），
 * 操作数据库进行数据的添加，根据数据库操作的结果给客户端返回响应的数据。
 */
router.post('/VideoHandler', function (req, res) {
	if (req.query.action == 'add') {
		req.query.action = 'find'
		handler(req, res, "videoList", null, function (arr) {
			// 组织视频信息并做校验
			var videos = {};
			videos.Vname = req.body.Vname;
			videos.Vtime = req.body.Vtime;
			videos.Vurl = req.body.Vurl;
			videos.ID = arr.length + 1;
			videos.Vstate = "";
      videos.createAt = new Date();
      videos.isFinish = false;
      videos.isViewed = false;
      videos.updateAt = new Date();
      videos.Vmosaic = "";
      req.query.action = 'add';
      if (videos.Vname && videos.Vtime && videos.Vurl) {
        handler(req, res, "videoList", videos, function (data) {
        	if (data.length == 0) {
        		res.end('{"err":"抱歉，添加失败"}');
        	} else {
        	  var obj = {
        	    ID: parseInt(data.ops[0].ID),
              Vurl: data.ops[0].Vurl,
              success: "成功" 
        	  }
        	  var str = JSON.stringify(obj);
            res.end(str);
        	}
        });
      } else {
        res.end('{"err":"抱歉，视频添加失败,基本信息不能为空"}');
      }
		});
	} else {
	  res.end('{"err":"抱歉，视频管理失败"}');
	}
});
// (2) 编写视频列表中视频的查询与分页功能
/*
 * 视频的查询与分页和学员列表的查询与分页、管理员的查询与分页也是一样。
 * 首先查询所有视频信息的数据，为下面的分页做数据条数的准备。
 * 根据 req.query.searchText 是否存在来判断客户端是的请求类型。
 * 如果存在则是查询，否则就是视频信息的请求，设置相应的条件查询语句。从数据库查询数据并把结果发送给客户端
 */
router.post('/VideoHandler', function (req, res) {
	if (/*接口*/) {
		/* 其他 */
	} else if (req.query.action == 'showlist') {
	  var selector = {};
	  // 如有模糊查询条件则以其为筛选器
	  if (req.body.searchText) {
	  	selector.Vname =  {$regex: '.*' + req.body.searchText + '.*'};
	  }
	  // 查询 videoList 列表获得总数据条数
	  handler(req, res, 'videoList', null, function (arr) {
	  	if (isNullObj(selector)) {
	  		selector = {
	  		  ID: {
	  		    $gt: arr.length - (parseInt(req.body.pageStart) * 3 - 3) - 3,
            $lte: arr.length - (parseInt(req.body.pageStart) * 3 - 3)
	  		  }
	  		};
	  	}
	  	//根据筛选器查询 videoList 获得的集合
	  	handler(req, res, 'videoList', selector, function (data) {
        if (data.length == 0) {
        	res.end('{"err": "系统中还没有视频"}');
        } else {
          var obj = {
            data: {
              pageSize: 3,
              count: arr.length,
              list: data,
              pageStart: req.body.pageStart
            },
            success: "成功"
          }
          var str = JSON.stringify(obj);
          res.end(str);
        }
      });
	  });
	} else {
	  res.end('{"err": "抱歉，视频管理失败"}');
	}
});
//(3) 编写视频列表中视频的编辑功能
/*
 * 首先按客户端传过来的视频的 ID 在数据库中查询该视频的数据信息，
 * 然后判断该视频信息中的视频的路径是否与客户端传过来的视频的地址一致，
 * 如不一致则通过 fs 模块删除旧视频的文件。
 * 设置操作符 selectors 变量，操作数据库然后给客户端返回操作后的结果。
 */
router.post('/VideoHandler', function (req, res) {
	if (/*其他接口*/){
   /*其他接口内容*/
  } else if (req.query.action == 'update') {
    //根据 ID 查询对应的视频 document
    req.query.action = 'find'
    handler(req, res, "videoList", {ID: parseInt(req.body.ID)}, function (data) {
    	if (data.length == 0) {
    		res.end('{"err": "抱歉，系统中查不到该视频"}');
    	}else {
    	  //如果对视频做更新操作是更改了视频源则删除原视频源
    	  if (data[0].Vurl !== req.body.Vurl) {
    	  	fs.unlink(data[0].Vurl, function (err) {
    	  		if (err) return console.log(err);
    	  	})
    	  }
    	  var selectors = [
    	    {"ID": parseInt(req.body.ID)},
          {
            "$set": {
              Vname: req.body.Vname,
              Vtime: req.body.Vtime,
              Vurl: req.body.Vurl,
              upDateAt: new Date()
            }
          }
    	  ];
    	  // 根据传入数据更新视频列表
    	  req.query.action = 'update';
    	  handler(req, res, "videoList", selectors, function (da) {
    	  	if (da.length == 0) {
    	  		res.end(('{"err":"抱歉，更新失败"}');
    	  	} else {
    	  	  res.end('{"success": "更新成功"}');
    	  	}
    	  })
    	}
    });
  } else {
    res.end('{"err":"抱歉，视频管理失败"}');
  }
});
// (4) 编写视频列表中视频的删除功能
/*
 * 如果要删除的视频绑定着课程，那么这条视频的数据就不能被删除，这样的判断在客户端已经处理过了，我们可以放心大胆的在数据库中删除客户端传过来的视频信息。
 * 删除该视频信息后还要迭代处理一下大于该视频 ID 的视频信息。
 * 注意：迭代处理删除后的 ID 的函数我们写成了函数表达式，所以要把这个函数表达式放在handler.js 加载模块后，所有的路径路由之前。
 */
router.get('/VideoHandler', function (req, res) {
  // 删除视频列表中的视频
  if (req.query.action == 'delete') {
    req.query.action = 'find';
    // 根据 ID 查询当前视频 document 获得当前视频的 Vurl 字段
  	handler(req, res, "videoList", {ID: parseInt(req.body.ID)}, function (data) {
  		if (data.length == 0 ) {
  			res.end(('{"err":"抱歉，系统中查不到该视频"}');
  		}else {
  		  req.query.action = 'delete';
  		  handler(req, res, "videoList", {ID: parseInt(req.body.ID)}, function (data) {
  		    res.end('{"success": "删除成功"}');
  		  });
  		}
  	})
  }
});