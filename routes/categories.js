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
    let returnData;
    if (doc) {
        if (doc.length) {
            returnData = doc.map(cate => {
                return {
                    categoryId: cate.categoryId,
                    categoryName: cate.categoryName,
                    children: cate.children
                };
            });
        } else {
            returnData = [];
        }
        ctx.body = {
            errNo: 0,
            errStr: 'success',
            data: {
                list: returnData
            }
        };
    } else {
        ctx.body = {
            errNo: 10,
            errStr: '出错啦，请稍后重试',
            data: ''
        };
    }
});
router.post('/delete_child_category', async function(ctx, next) {
    let categoryCollection = database.collection('categories');
    let { categoryId, name } = ctx.request.body;
    let result = await categoryCollection.update({
        categoryId: parseInt(categoryId)
    }, {
        $pull: {
            children: name
        }
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
router.post('/add_child_category', async function(ctx, next) {
    let categoryCollection = database.collection('categories');
    let { categoryId, name } = ctx.request.body;
    let result = await categoryCollection.update({
        categoryId: parseInt(categoryId)
    }, {
        $push: {
            children: name
        }
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
router.post('/add_category', async function(ctx, next) {
    let categoryCollection = database.collection('categories');
    let name = ctx.request.body.name;
    let cateDoc = await categoryCollection.find().toArray();
    if (!cateDoc) {
        ctx.body = {
            errNo: 10,
            errStr: '出错啦，请稍后重试',
            data: ''
        };
        return;
    }
    console.log(cateDoc.length, cateDoc[cateDoc.length - 1].categoryId);
    let categoryId = cateDoc.length ?
        cateDoc[cateDoc.length - 1].categoryId + 1 :
        1;
    let result = await categoryCollection.insertOne({
        categoryId,
        categoryName: name,
        children: []
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