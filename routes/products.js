const router = require('koa-router')();
let MongoClient = require('mongodb').MongoClient;

let database;
(async function() {
    let client = await MongoClient.connect('mongodb://127.0.0.1');
    database = client.db('happyBuy');
    console.log('数据库连接成功！');
})();

router.prefix('/products');

router.get('/', async function(ctx, next) {
    ctx.body = 'this is a products response';
});

router.get('/get_product_list', async function(ctx, next) {
    let productCollection = database.collection('products');
    let doc = await productCollection.find().toArray();
    ctx.body = {
        errNo: 0,
        errStr: 'success',
        data: doc
    };
});
router.get('/get_product_detail', async function(ctx, next) {
    let productCollection = database.collection('products');
    let productId = parseInt(ctx.query.productId);
    let doc = await productCollection.findOne({ productId });
    console.log(doc);
    ctx.body = {
        errNo: 0,
        errStr: 'success',
        data: doc
    };
});
module.exports = router;