const router = require('koa-router')();
let MongoClient = require('mongodb').MongoClient;

let database;
(async function() {
    let client = await MongoClient.connect('mongodb://127.0.0.1');
    database = client.db('happyBuy');
    console.log('数据库连接成功！');
})();

router.prefix('/admins');

router.get('/', async function(ctx, next) {
    ctx.body = 'this is a categories response';
});
router.post('/login', async function(ctx, next) {
    let { adminName, password } = ctx.request.body;
    let userCollection = database.collection('admins');
    let userDoc = await userCollection.findOne({
        adminName
    });
    if (!userDoc) {
        ctx.body = {
            errNo: 1,
            errStr: '用户名不存在'
        };
    } else if (userDoc.password !== password) {
        ctx.body = {
            errNo: 2,
            errStr: '密码错误'
        };
    } else {
        ctx.cookies.set('adminId', userDoc.adminId);
        ctx.body = {
            errNo: 0,
            errStr: 'success',
            data: {
                userName: userDoc.adminName
            }
        };
    }
});
module.exports = router;