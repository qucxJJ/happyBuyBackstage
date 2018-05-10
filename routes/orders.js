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
        payList.push(userDoc.cartList[index]);
        // 从购物车中删除
        userCollection.update({
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
        turnoverTime: 0
    };
    console.log(addressIndex, order);
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
module.exports = router;