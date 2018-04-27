const router = require('koa-router')();
let MongoClient = require('mongodb').MongoClient;
let config = require('../common/config');

let database;
(async function() {
    let client = await MongoClient.connect('mongodb://127.0.0.1');
    database = client.db('happyBuy');
    console.log('数据库连接成功！');
})();

router.prefix('/users');

router.get('/', async function(ctx, next) {
    ctx.body = 'this is a users response';
});

router.get('/get_user_info', async function(ctx, next) {
    let userCollection = database.collection('users');
    let userId = ctx.cookies.get('userId');
    if (!userId) {
        ctx.body = {
            errNo: 1,
            errStr: '用户未登录,无法获取当前用户的信息'
        };
        return;
    }
    let userDoc = await userCollection.findOne({ userId });
    let userInfo = {};
    userInfo.userName = userDoc.userName;
    userInfo.cartNum = userDoc.cartList.length;
    ctx.body = {
        errNo: 0,
        errStr: 'success',
        data: userInfo
    };
});

router.post('/login', async function(ctx, next) {
    let { userName, password } = ctx.request.body;
    let userCollection = database.collection('users');
    let userDoc = await userCollection.findOne({ userName });
    if (!userDoc) {
        ctx.body = {
            errNo: 1,
            errStr: '用户名不存在'
        };
    } else if (userDoc.password !== password) {
        ctx.body = {
            errNo: 2,
            errStr: '密码错误'
        };
    } else {
        ctx.cookies.set('userId', userDoc.userId);
        ctx.body = {
            errNo: 0,
            errStr: 'success',
            data: ''
        };
    }
});
router.post('/logout', async function(ctx, next) {
    ctx.cookies.set('userId', '');
    ctx.body = {
        errNo: 0,
        errStr: 'success',
        data: ''
    };
});
router.post('/check_name_avail', async function(ctx, next) {
    let userCollection = database.collection('users');
    let userName = ctx.request.body.userName;
    let userDoc = await userCollection.findOne({ userName });
    if (!userDoc) {
        ctx.body = {
            errNo: 0,
            errStr: '用户名可用',
            data: ''
        };
    } else {
        ctx.body = {
            errNo: 1,
            errStr: '用户名已存在',
            data: ''
        };
    }
});
router.post('/register', async function(ctx, next) {
    let userCollection = database.collection('users');
    let {
        userName,
        password,
        phone,
        email,
        question,
        answer,
        createTime
    } = ctx.request.body;
    if (!userName || !password || !phone || !email || !question || !answer) {
        ctx.body = {
            errNo: 1,
            errStr: '必填参数没有填写完整'
        };
    } else {
        let userDoc = await userCollection.find().toArray();
        let userId = parseInt(userDoc[userDoc.length - 1].userId) + 1;
        let result = await userCollection.insertOne({
            userId,
            userName,
            password,
            phone,
            email,
            question,
            answer,
            imageHost: config.imageHost,
            avatar: '',
            createTime,
            updateTime: createTime,
            cartList: [],
            collectionList: [],
            footList: [],
            addressList: []
        });
        result = JSON.parse(result);
        if (result.ok !== 1) {
            ctx.body = {
                errNo: 10,
                errStr: '数据库操作失败',
                data: ''
            };
        } else {
            ctx.body = {
                errNo: 0,
                errStr: 'success',
                data: ''
            };
        }
    }
});
router.post('/check_phone_avail', async function(ctx, next) {
    let userCollection = database.collection('users');
    let phone = ctx.request.body.phone;
    let userDoc = await userCollection.findOne({ phone });
    if (!userDoc) {
        ctx.body = {
            errNo: 0,
            errStr: '手机号码可用'
        };
    } else {
        ctx.body = {
            errNo: 1,
            errStr: '该手机号码已被绑定'
        };
    }
});
router.post('/check_email_avail', async function(ctx, next) {
    let userCollection = database.collection('users');
    let email = ctx.request.body.email;
    let userDoc = await userCollection.findOne({ email });
    if (!userDoc) {
        ctx.body = {
            errNo: 0,
            errStr: '邮箱可用'
        };
    } else {
        ctx.body = {
            errNo: 1,
            errStr: '该邮箱已被绑定'
        };
    }
});

module.exports = router;