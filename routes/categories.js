const router = require('koa-router')();
let MongoClient = require('mongodb').MongoClient;

let database;
(async function() {
    let client = await MongoClient.connect('mongodb://127.0.0.1');
    database = client.db('happyBuy');
    console.log('数据库连接成功！');
})();

router.prefix('/categories');

router.get('/', async function(ctx, next) {
    ctx.body = 'this is a categories response';
});

router.get('/get_category_list', async function(ctx, next) {
    let categoryCollection = database.collection('categories');
    let doc = await categoryCollection.find().toArray();
    let returnData = doc.map(cate => {
        return {
            categoryId: cate.categoryId,
            categoryName: cate.categoryName,
            list: cate.list
        };
    });
    ctx.body = {
        errNo: 0,
        errStr: 'success',
        data: returnData
    };
});

module.exports = router;