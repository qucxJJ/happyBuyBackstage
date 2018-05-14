const multer = require('koa-multer'); //加载koa-multer模块
//配置
let storage = multer.diskStorage({
    //文件保存路径
    destination: function(req, file, cb) {
        cb(null, 'public/images/evals/');
    },
    //修改文件名称
    filename: function(req, file, cb) {
        var fileFormat = file.originalname.split('.');
        cb(null, Date.now() + '.' + fileFormat[fileFormat.length - 1]);
    }
});
//加载配置
let upload = multer({ storage: storage });
module.exports = upload;