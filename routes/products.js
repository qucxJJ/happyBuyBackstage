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
    let {
        keyword,
        page,
        pageSize,
        sort,
        startPrice,
        endPrice
    } = ctx.request.query;
    sort = JSON.parse(sort);
    let doc = await productCollection
        .find({
            productName: new RegExp(keyword),
            price: {
                $gte: Number(startPrice),
                $lte: Number(endPrice)
            }
        })
        .limit(parseInt(pageSize))
        .skip(parseInt(page) * parseInt(pageSize))
        .sort({
            [sort.name]: parseInt(sort.type)
        })
        .toArray();
    if (doc) {
        ctx.body = {
            errNo: 0,
            errStr: 'success',
            data: {
                list: doc.map(item => {
                    return {
                        productId: item.productId,
                        productName: item.productName,
                        mainImage: config.getProductPicUrl(item.mainImage),
                        price: item.price,
                        payNum: item.payNum
                    };
                }),
                totalNum: doc.length
            }
        };
    }
});
router.get('/get_all_product_list', async function(ctx, next) {
    let productCollection = database.collection('products');
    let { productId, keyword } = ctx.request.query;
    let doc;
    if (productId) {
        productId = parseInt(productId);
        doc = await productCollection.findOne({
            productId
        });
    } else {
        doc = await productCollection
            .find({
                productName: new RegExp(keyword)
            })
            .toArray();
    }
    if (doc) {
        ctx.body = {
            errNo: 0,
            errStr: 'success',
            data: productId ? [doc] : doc
        };
    } else {
        ctx.body = {
            errNo: 10,
            errStr: '出错啦，请稍后重试',
            data: ''
        };
    }
});
router.get('/get_product_detail', async function(ctx, next) {
    let productCollection = database.collection('products');
    let productId = parseInt(ctx.query.productId);
    let userId = parseInt(ctx.cookies.get('userId'));
    let doc = await productCollection.findOne({ productId });
    if (doc) {
        let detailHtmlArr = doc.detailPics.map(item => {
            return `<p><img src="${config.getProductPicUrl(
        item
      )}" style="width: 900px;"></p>`;
        });
        let collectStatus;
        if (userId) {
            let userCollection = database.collection('users');
            let userDoc = await userCollection.findOne({
                userId
            });
            // 添加足迹
            let index = userDoc.footList.findIndex(item => {
                return item.productId === doc.productId;
            });
            if (index > -1) {
                userCollection.update({
                    userId
                }, {
                    $pull: {
                        footList: {
                            productId: doc.productId
                        }
                    }
                });
            }
            let result = await userCollection.update({
                userId
            }, {
                $push: {
                    footList: {
                        productId: doc.productId,
                        productName: doc.productName,
                        mainImage: doc.mainImage,
                        price: doc.price
                    }
                }
            });
            let user = await userCollection.findOne({
                userId
            });
            result = JSON.parse(result);
            if (!result.ok) {
                console.log('足迹记录失败');
            }
            // 检查收藏
            let collectIndex = userDoc.collectionList.findIndex(item => {
                return item.productId === productId;
            });
            if (collectIndex > -1) {
                collectStatus = 1;
            } else {
                collectStatus = 2;
            }
        }
        ctx.body = {
            errNo: 0,
            errStr: 'success',
            data: {
                productId: doc.productId,
                productName: doc.productName,
                price: doc.price,
                stockNum: doc.stockNum,
                mainImage: config.getProductPicUrl(doc.mainImage),
                sizes: doc.sizes,
                attributes: doc.attributes.map(item => {
                    return {
                        name: item.name,
                        image: config.getProductPicUrl(item.image)
                    };
                }),
                params: doc.params,
                detail: detailHtmlArr.join(''),
                payNum: doc.payNum,
                collectStatus: collectStatus ? collectStatus : 0
            }
        };
    } else {
        ctx.body = {
            errNo: 1,
            errStr: '找不到该商品哦~',
            data: ''
        };
    }
});
router.get('/get_all_product_detail', async function(ctx, next) {
    let productCollection = database.collection('products');
    let productId = parseInt(ctx.query.productId);
    let doc = await productCollection.findOne({ productId });
    if (doc) {
        ctx.body = {
            errNo: 0,
            errStr: 'success',
            data: {
                productId: doc.productId,
                productName: doc.productName,
                price: doc.price,
                stockNum: doc.stockNum,
                mainImage: {
                    url: config.getProductPicUrl(doc.mainImage),
                    name: doc.mainImage
                },
                sizes: doc.sizes,
                attributes: doc.attributes.map(item => {
                    return {
                        name: item.name,
                        image: item.image,
                        url: config.getProductPicUrl(item.image)
                    };
                }),
                params: doc.params,
                detailPics: doc.detailPics.map(item => {
                    return {
                        name: item,
                        url: config.getProductPicUrl(item)
                    };
                }),
                payNum: doc.payNum
            }
        };
    } else {
        ctx.body = {
            errNo: 1,
            errStr: '找不到该商品哦~',
            data: ''
        };
    }
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
        price: parseInt(price),
        stockNum: parseInt(stockNum),
        mainImage,
        sizes,
        attributes,
        params,
        detailPics,
        payNum: 0,
        createTime: parseInt(time),
        updateTime: parseInt(time)
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
router.post('/edit_product_info', async function(ctx, next) {
    let productCollection = database.collection('products');
    let {
        productId,
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
    let result = await productCollection.update({
        productId: parseInt(productId)
    }, {
        $set: {
            productName,
            price: parseInt(price),
            stockNum: parseInt(stockNum),
            mainImage,
            sizes,
            attributes,
            params,
            detailPics,
            updateTime: parseInt(time)
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
module.exports = router;