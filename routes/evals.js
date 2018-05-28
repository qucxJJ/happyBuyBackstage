const router = require('koa-router')();
let MongoClient = require('mongodb').MongoClient;
let config = require('../common/config');
let evalUpload = require('../common/evalUpload');

let database;
(async function() {
    let client = await MongoClient.connect('mongodb://127.0.0.1');
    database = client.db('happyBuy');
    console.log('数据库连接成功！');
})();

router.prefix('/evals');

router.get('/', async function(ctx, next) {
    ctx.body = 'this is a evals response';
});
router.post('/upload', evalUpload.single('file'), async function(ctx, next) {
    ctx.body = {
        errNo: 0,
        errStr: 'success',
        data: ctx.req.file.filename
    };
});
router.post('/submit_eval', async function(ctx, next) {
    let evalsCollection = database.collection('evals');
    let productCollection = database.collection('products');
    let orderCollection = database.collection('orders');
    let userId = parseInt(ctx.cookies.get('userId'));
    let {
        orderNumber,
        type,
        content,
        pics,
        productId,
        size,
        attr,
        num,
        pic
    } = ctx.request.body;
    productId = parseInt(productId);
    (type = parseInt(type)), (num = parseInt(num));
    let evalDoc = await evalsCollection.find().toArray();
    let evalId = evalDoc.length ? evalDoc[evalDoc.length - 1].evalId + 1 : 100001;
    let createTime = Date.now();
    let productDoc = await productCollection.findOne({
        productId
    });
    let result = await evalsCollection.insertOne({
        evalId,
        userId,
        productId,
        productInfo: {
            productName: productDoc.productName,
            pic,
            size,
            num,
            attr,
            price: productDoc.price
        },
        orderNumber,
        type,
        content,
        pics,
        createTime
    });
    let res = await orderCollection.update({
        orderNumber,
        'productList.productId': productId,
        'productList.attr': attr,
        'productList.size': size,
        'productList.num': num
    }, {
        $set: {
            'productList.$.isEval': 1
        }
    });
    console.log(JSON.parse(res));
    let orderDoc = await orderCollection.findOne({
        orderNumber
    });
    let flag = true;
    for (let i = 0; i < orderDoc.productList.length; i++) {
        if (orderDoc.productList[i].isEval === 0) {
            console.log('未评价');
            flag = false;
        }
    }
    console.log(flag);
    if (flag) {
        await orderCollection.update({
            orderNumber
        }, {
            $set: {
                isEvalAll: 1
            }
        });
    }
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
router.get('/get_product_eval', async function(ctx, next) {
    let evalsCollection = database.collection('evals');
    let userCollection = database.collection('users');
    let { type, productId } = ctx.request.query;
    productId = parseInt(productId);
    let evalDoc = await evalsCollection
        .find({
            productId
        })
        .toArray();
    type = parseInt(type);
    let evals;
    if (type) {
        evals = evalsCollection
            .find({
                productId,
                type
            })
            .toArray();
    } else {
        evals = evalDoc;
    }
    console.log(type, productId, evals);
    if (!evals) {
        ctx.body = {
            errNo: 10,
            errStr: '出错啦，请稍后重试',
            data: ''
        };
    } else {
        let res = [];
        for (let i = 0; i < evals.length; i++) {
            let item = evals[i];
            let userDoc = await userCollection.findOne({
                userId: item.userId
            });
            let len = userDoc.userName.length - 2;
            let userName = userDoc.userName[0];
            for (let i = 0; i < len; i++) {
                userName += '*';
            }
            userName += userDoc.userName[len + 1];
            res.push({
                userName,
                avatar: config.getAvatarUrl(userDoc.avatar),
                createTime: item.createTime,
                content: item.content,
                type: item.type,
                size: item.productInfo.size,
                attr: item.productInfo.attr,
                pics: item.pics ?
                    item.pics.map(pic => {
                        return config.getEvalPicPath(pic);
                    }) :
                    []
            });
        }
        let good = evalDoc.filter(item => {
            return item.type === 1;
        });
        let middle = evalDoc.filter(item => {
            return item.type === 2;
        });
        let bad = evalDoc.filter(item => {
            return item.type === 3;
        });
        ctx.body = {
            errNo: 0,
            errStr: 'success',
            data: {
                list: res,
                goodNum: good.length,
                middleNum: middle.length,
                badNum: bad.length,
                totalNum: evalDoc.length
            }
        };
    }
});
router.get('/get_user_eval', async function(ctx, next) {
    let evalsCollection = database.collection('evals');
    let userId = parseInt(ctx.cookies.get('userId'));
    if (!userId) {
        ctx.body = {
            errNo: 11,
            errStr: '用户未登录',
            data: ''
        };
    } else {
        let evals = await evalsCollection
            .find({
                userId
            })
            .sort({
                createTime: -1
            })
            .toArray();
        ctx.body = {
            errNo: 0,
            errStr: 'success',
            data: evals.map(item => {
                return {
                    evalId: item.evalId,
                    productId: item.productId,
                    type: item.type,
                    productInfo: {
                        productName: item.productInfo.productName,
                        pic: config.getProductPicUrl(item.productInfo.pic),
                        size: item.productInfo.size,
                        attr: item.productInfo.attr,
                        num: item.productInfo.num
                    },
                    content: item.content,
                    pics: item.pics ?
                        item.pics.map(pic => {
                            return config.getEvalPicPath(pic);
                        }) :
                        [],
                    createTime: item.createTime
                };
            })
        };
    }
});
module.exports = router;