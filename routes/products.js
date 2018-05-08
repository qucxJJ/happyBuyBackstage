const router = require('koa-router')();
let MongoClient = require('mongodb').MongoClient;
let config = require('../common/config');
let productUpload = require('../common/productUpload');

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
    let keyword = ctx.request.query.keyword;
    console.log(keyword);
    let doc = await productCollection
        .find({
            productName: new RegExp(keyword)
        })
        .toArray();
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
    ctx.body = {
        errNo: 0,
        errStr: 'success',
        data: doc
    };
});
router.get('/get_slider_pic', async function(ctx, next) {
    let list = [];
    for (let i = 1; i <= 6; i++) {
        list.push(`/images/slider/ad${i}.jpg`);
    }
    ctx.body = {
        errNo: 0,
        errStr: 'success',
        data: {
            list
        }
    };
});
router.post('/upload', productUpload.single('file'), async function(ctx, next) {
    ctx.body = {
        errNo: 0,
        errStr: 'success',
        data: ctx.req.file.filename
    };
});
router.post('/add_product', async function(ctx, next) {
    let productCollection = database.collection('products');
    let {
        productName,
        price,
        stockNum,
        mainImage,
        sizes,
        attributes,
        params,
        detailPics
    } = ctx.request.body;
    let time = Date.now();
    let proDoc = await productCollection.find().toArray();
    if (!proDoc) {
        ctx.body = {
            errNo: 10,
            errStr: '出错啦，请稍后重试',
            data: ''
        };
        return;
    }
    let productId = proDoc.length ?
        proDoc[proDoc.length - 1].productId + 1 :
        10000001;
    let result = await productCollection.insertOne({
        productId,
        productName,
        price,
        stockNum,
        mainImage,
        sizes,
        attributes,
        params,
        detailPics,
        payNum: 0
    });
    result = JSON.parse(result);
    if (result.ok) {
        ctx.body = {
            errNo: 0,
            errStr: 'success',
            data: ''
        };
    } else {
        ctx.body = {
            errNo: 10,
            errStr: '出错啦，请稍后重试',
            data: ''
        };
    }
});
module.exports = router;