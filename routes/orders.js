const router = require('koa-router')();
let MongoClient = require('mongodb').MongoClient;
let config = require('../common/config');

let database;
(async function() {
    let client = await MongoClient.connect('mongodb://127.0.0.1');
    database = client.db('happyBuy');
    console.log('数据库连接成功！');
})();

router.prefix('/orders');

router.get('/', async function(ctx, next) {
    ctx.body = 'this is a orders response';
});
router.post('/submit_order', async function(ctx, next) {
    let orderCollection = database.collection('orders');
    let userCollection = database.collection('users');
    let expressCollection = database.collection('express');
    let productCollection = database.collection('products');
    // 获取参数
    let userId = parseInt(ctx.cookies.get('userId'));
    let {
        addressId,
        expressId,
        payListIds,
        userMsg,
        totalPrice
    } = ctx.request.body;
    addressId = parseInt(addressId);
    expressId = parseInt(expressId);
    // 创建时间
    let time = Date.now();
    let userDoc = await userCollection.findOne({
        userId
    });
    // 获取选中商品详细信息
    let payList = [];
    for (let i = 0; i < payListIds.length; i++) {
        payListIds[i] = parseInt(payListIds[i]);

        let index = userDoc.cartList.findIndex(item => {
            return item.id === payListIds[i];
        });
        let temp = userDoc.cartList[index];
        payList.push({
            productId: temp.productId,
            productName: temp.productName,
            price: temp.price,
            pic: temp.pic,
            num: temp.num,
            size: temp.size,
            attr: temp.attr,
            isEval: 0
        });
        // 相应商品销量增加
        let productDoc = await productCollection.findOne({
            productId: userDoc.cartList[index].productId
        });
        await productCollection.update({
            productId: userDoc.cartList[index].productId
        }, {
            $set: {
                payNum: productDoc.payNum + temp.num
            }
        });
        // 商品库存减少
        await productCollection.update({
            productId: userDoc.cartList[index].productId
        }, {
            $set: {
                stockNum: productDoc.stockNum - temp.num
            }
        });
        // 从购物车中删除
        await userCollection.update({
            userId
        }, {
            $pull: {
                cartList: {
                    id: payListIds[i]
                }
            }
        });
    }
    // 获取快递信息
    let expressDoc = await expressCollection.findOne({
        expressId
    });
    // 获取地址信息
    let addressIndex = userDoc.addressList.findIndex(item => {
        return item.addressId === addressId;
    });
    let addressInfo = userDoc.addressList[addressIndex];
    // 生成订单号
    let orderDoc = orderCollection.find().toArray();
    let randomNumber = Math.floor(Math.random() * 10000);
    let orderNumber = `${time}${randomNumber}${userId.toString().slice(5)}`;
    // 创建订单
    let order = {
        orderNumber,
        userId,
        address: addressInfo,
        express: {
            expressId: expressDoc.expressId,
            expressName: expressDoc.expressName,
            pic: expressDoc.pic
        },
        userMsg,
        status: 1,
        productList: payList,
        totalPrice,
        createTime: parseInt(time),
        payTime: 0,
        sendTime: 0,
        turnoverTime: 0,
        isEvalAll: 0
    };
    let result = await orderCollection.insertOne(order);
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

router.get('/get_order_list', async function(ctx, next) {
    let orderCollection = database.collection('orders');
    let userId = parseInt(ctx.cookies.get('userId'));
    let type = ctx.request.query.type ? parseInt(ctx.request.query.type) : 0;
    console.log(userId, typeof userId, type, typeof type);
    if (!userId) {
        ctx.body = {
            errNo: 11,
            errStr: '用户未登录',
            data: ''
        };
    } else {
        let orderDoc;
        if (type) {
            orderDoc = await orderCollection
                .find({
                    userId,
                    status: type
                })
                .toArray();
        } else {
            orderDoc = await orderCollection
                .find({
                    userId
                })
                .toArray();
        }
        if (!orderDoc) {
            ctx.body = {
                errNo: 10,
                errStr: '出错啦，请稍后重试',
                data: ''
            };
        } else {
            ctx.body = {
                errNo: 0,
                errStr: 'success',
                data: orderDoc.map(order => {
                    return {
                        orderNumber: order.orderNumber,
                        userMsg: order.userMsg,
                        status: order.status,
                        productList: order.productList.map(item => {
                            return {
                                productId: item.productId,
                                productName: item.productName,
                                price: item.price,
                                pic: config.getProductPicUrl(item.pic),
                                num: item.num,
                                size: item.size,
                                attr: item.attr,
                                totalPrice: item.num * item.price
                            };
                        }),
                        totalPrice: order.totalPrice,
                        createTime: order.createTime,
                        isEvalAll: order.isEvalAll
                    };
                })
            };
        }
    }
});
router.get('/get_all_order_list', async function(ctx, next) {
    let orderCollection = database.collection('orders');
    let type = ctx.request.query.type ? parseInt(ctx.request.query.type) : 0;
    let orderNumber = ctx.request.query.orderNumber;
    let orderDoc;
    if (orderNumber) {
        orderDoc = await orderCollection
            .find({
                orderNumber
            })
            .toArray();
    } else {
        if (type) {
            orderDoc = await orderCollection
                .find({
                    status: type
                })
                .toArray();
        } else {
            orderDoc = await orderCollection.find().toArray();
        }
    }
    if (!orderDoc) {
        ctx.body = {
            errNo: 10,
            errStr: '出错啦，请稍后重试',
            data: ''
        };
    } else {
        ctx.body = {
            errNo: 0,
            errStr: 'success',
            data: orderDoc.map(order => {
                return {
                    orderNumber: order.orderNumber,
                    userMsg: order.userMsg,
                    status: order.status,
                    address: order.address.addressDetail,
                    express: order.express.expressName,
                    productList: order.productList.map(item => {
                        return {
                            productId: item.productId,
                            productName: item.productName,
                            price: item.price,
                            pic: config.getProductPicUrl(item.pic),
                            num: item.num,
                            size: item.size,
                            attr: item.attr,
                            totalPrice: item.num * item.price
                        };
                    }),
                    totalPrice: order.totalPrice,
                    createTime: order.createTime
                };
            })
        };
    }
});
router.post('/get_order_detail', async function(ctx, next) {
    let orderCollection = database.collection('orders');
    let userId = parseInt(ctx.cookies.get('userId'));
    let orderNumber = ctx.request.body.orderNumber;
    if (!userId) {
        ctx.body = {
            errNo: 11,
            errStr: '用户未登录',
            data: ''
        };
    } else {
        let order = await orderCollection.findOne({
            userId,
            orderNumber
        });

        if (!order) {
            ctx.body = {
                errNo: 10,
                errStr: '出错啦，请稍后重试',
                data: ''
            };
        } else {
            ctx.body = {
                errNo: 0,
                errStr: 'success',
                data: {
                    orderNumber: order.orderNumber,
                    address: {
                        addressDetail: order.address.addressDetail,
                        receiveName: order.address.receiveName,
                        receivePhone: order.address.receivePhone
                    },
                    express: {
                        expressName: order.express.expressName,
                        pic: config.getExpressPicUrl(order.express.pic)
                    },
                    userMsg: order.userMsg,
                    status: order.status,
                    productList: order.productList.map(item => {
                        return {
                            productId: item.productId,
                            productName: item.productName,
                            price: item.price,
                            pic: config.getProductPicUrl(item.pic),
                            num: item.num,
                            size: item.size,
                            attr: item.attr,
                            totalPrice: item.num * item.price,
                            isEval: item.isEval
                        };
                    }),
                    totalPrice: order.totalPrice,
                    createTime: order.createTime,
                    payTime: order.payTime,
                    sendTime: order.sendTime,
                    turnoverTime: order.turnoverTime,
                    isEvalAll: order.isEvalAll
                }
            };
        }
    }
});
router.post('/pay_order', async function(ctx, next) {
    let orderCollection = database.collection('orders');
    let userId = parseInt(ctx.cookies.get('userId'));
    let orderNumber = ctx.request.body.orderNumber;
    let result = await orderCollection.update({
        orderNumber,
        userId
    }, {
        $set: {
            status: 2
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
router.post('/cancel_order', async function(ctx, next) {
    let orderCollection = database.collection('orders');
    let userId = parseInt(ctx.cookies.get('userId'));
    let orderNumber = ctx.request.body.orderNumber;
    let result = await orderCollection.update({
        orderNumber,
        userId
    }, {
        $set: {
            status: 5
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
router.post('/send_order', async function(ctx, next) {
    let orderCollection = database.collection('orders');
    let { orderNumber, expressNumber } = ctx.request.body;
    let result = await orderCollection.update({
        orderNumber
    }, {
        $set: {
            status: 3,
            expressNumber
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
router.post('/received_order', async function(ctx, next) {
    let orderCollection = database.collection('orders');
    let userId = parseInt(ctx.cookies.get('userId'));
    let orderNumber = ctx.request.body.orderNumber;
    let result = await orderCollection.update({
        orderNumber,
        userId
    }, {
        $set: {
            status: 4
        }
    });
    result = JSON.parse(result);
    console.log(result, typeof result, result.ok);
    if (result.ok) {
        console.log('chenggong');
        ctx.body = {
            errNo: 0,
            errStr: 'success',
            data: ''
        };
    } else {
        console.log('失败判断也走了');
        ctx.body = {
            errNo: 10,
            errStr: '出错啦，请稍后重试',
            data: ''
        };
    }
});
module.exports = router;