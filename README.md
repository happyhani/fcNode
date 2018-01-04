###Welcome to use MarkDown

> 0801_02翡翠学院后台服务器搭建
### 1 编写操作数据库模块和录入管理员的权限
* 文件dbhandler.js
* node 操作 MongoDB 数据库时编写的代码，在这里我们主要修改了数据库操作方法类别对象 methodType 中的 key 值和 value 值。
* key 值根据接口的 aciton 属性设置，value 值根据相应 key 值的功能设置。
* 数据存储到的数据库为：administor
### 2 实现管理员列表中的相关功能
* 安装crypto@1.0.1  MongoDB@3.0.1
* 设置接口路由的 handler.js 文件的基本内容

### 3 实现验证码、登录、退出、修改密码、请求个人信息等功能
### 4 实现学员列表的相关功能