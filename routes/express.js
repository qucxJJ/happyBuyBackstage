const router = require('koa-router')();
let MongoClient = require('mongodb').MongoClient;
let config = require('../common/config');

let database;
(async function() {
    let client = await MongoClient.connect('mongodb://127.0.0.1');
    database = client.db('happyBuy');
    console.log('数据库连接成功！');
})();

router.prefix('/express');

router.get('/', async function(ctx, next) {
    ctx.body = 'this is a express response';
});
router.get('/get_express_list', async function(ctx, next) {
    let expressCollection = database.collection('express');
    let expressDoc = await expressCollection.find().toArray();
    if (!expressDoc) {
        ctx.body = {
            errNo: 10,
            errStr: '出错啦，请稍后重试',
            data: ''
        };
    } else {
        ctx.body = {
            errNo: 0,
            errStr: 'success',
            data: expressDoc.map(item => {
                return {
                    expressId: item.expressId,
                    expressName: item.expressName,
                    pic: config.getExpressPicUrl(item.pic)
                };
            })
        };
    }
});
module.exports = router;