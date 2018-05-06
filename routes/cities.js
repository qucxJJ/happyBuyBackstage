const router = require('koa-router')();
let MongoClient = require('mongodb').MongoClient;

let database;
(async function() {
    let client = await MongoClient.connect('mongodb://127.0.0.1');
    database = client.db('happyBuy');
    console.log('数据库连接成功！');
})();

router.prefix('/cities');

router.get('/', async function(ctx, next) {
    ctx.body = 'this is a cities response';
});

router.get('/get_province_list', async function(ctx, next) {
    let citiesCollection = database.collection('cities');
    let doc = await citiesCollection.find({ parentId: 0 }).toArray();
    ctx.body = {
        errNo: 0,
        errStr: 'success',
        data: doc.map(item => {
            return {
                code: item.code,
                name: item.name,
                parentId: item.parentId
            };
        })
    };
});
router.get('/get_cities_list', async function(ctx, next) {
    let citiesCollection = database.collection('cities');
    let parentId = parseInt(ctx.query.parentId);
    let doc = await citiesCollection.find({ parentId }).toArray();
    ctx.body = {
        errNo: 0,
        errStr: 'success',
        data: doc.map(item => {
            return {
                code: item.code,
                name: item.name,
                parentId: item.parentId
            };
        })
    };
});
router.get('/get_county_list', async function(ctx, next) {
    let citiesCollection = database.collection('cities');
    let parentId = parseInt(ctx.query.parentId);
    let doc = await citiesCollection.find({ parentId }).toArray();
    ctx.body = {
        errNo: 0,
        errStr: 'success',
        data: doc.map(item => {
            return {
                code: item.code,
                name: item.name,
                parentId: item.parentId
            };
        })
    };
});
module.exports = router;