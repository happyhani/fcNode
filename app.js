var express = require('express');
var path = require('path');
var favicon = require('serve-favicon');
var logger = require('morgan');
var cookieParser = require('cookie-parser'); // 客户端会话
var bodyParser = require('body-parser');
var session = require('express-session'); // 服务端会话   Session是有状态的，而HTTP协议是无状态的
// express-session中间件将会话数据存储在服务器上；它仅将会话标识（而非会话数据）保存在 cookie 中。

//加载控制流模块
var index = require('./routes/index');
var users = require('./routes/users');

var app = express();

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'jade');

// uncomment after placing your favicon in /public
// app.use(favicon(path.join(__dirname, 'public', 'favicon.ico')));
// use body-parsing middleware to populate req.body.
app.use(logger('dev'));
app.use(bodyParser.json());                             // for parsing application/json
app.use(bodyParser.urlencoded({ extended: false }));    // for parsing application/x-www-form-urlencoded  窗体数据被编码为名称/值对 
// app.use(multer());                                   // for parsing multipart/form-data  窗体数据被编码为一条消息，页上的每个控件对应消息中的一个部分。
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

//使用格式
app.use('/', index);
app.use('/users', users);

// catch 404 and forward to error handler
app.use(function(req, res, next) {
  var err = new Error('Not Found');
  err.status = 404;
  next(err);
});

// error handler
app.use(function(err, req, res, next) {
  // set locals, only providing error in development
  // app.locals属性的值将在应用程序的整个生命周期中保持不变，而res.locals属性只在请求的生命周期内有效
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};

  // render the error page
  res.status(err.status || 500);
  res.render('error');
});

module.exports = app;
