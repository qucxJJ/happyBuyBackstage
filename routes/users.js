const router = require('koa-router')();
let MongoClient = require('mongodb').MongoClient;
let config = require('../common/config');
let avatarUpload = require('../common/avatarUpload');

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
    let userDoc = await userCollection.findOne({
        userId
    });
    let userInfo = {};
    userInfo.userName = userDoc.userName;
    userInfo.cartNum = userDoc.cartList.length;
    userInfo.avatar = userDoc.imageHost + userDoc.avatar;
    ctx.body = {
        errNo: 0,
        errStr: 'success',
        data: userInfo
    };
});

router.post('/login', async function(ctx, next) {
    let { userName, password } = ctx.request.body;
    let userCollection = database.collection('users');
    let userDoc = await userCollection.findOne({
        userName
    });
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
    let userDoc = await userCollection.findOne({
        userName
    });
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
            realName: '',
            sex: '',
            birthday: '',
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
                errStr: '注册失败，请稍后重试',
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
    let userDoc = await userCollection.findOne({
        phone
    });
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
    let userDoc = await userCollection.findOne({
        email
    });
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

router.post('/get_reset_question', async function(ctx, next) {
    let userCollection = database.collection('users');
    let userName = ctx.request.body.userName;
    let userDoc = await userCollection.findOne({
        userName
    });
    if (!userDoc) {
        ctx.body = {
            errNo: 1,
            errStr: '用户名不存在',
            data: ''
        };
    } else {
        ctx.body = {
            errNo: 0,
            errStr: 'success',
            data: {
                question: userDoc.question
            }
        };
    }
});
router.post('/check_reset_answer', async function(ctx, next) {
    let userCollection = database.collection('users');
    let { userName, answer } = ctx.request.body;
    let userDoc = await userCollection.findOne({
        userName
    });
    if (userDoc.answer !== answer) {
        ctx.body = {
            errNo: 1,
            errStr: '答案错误',
            data: ''
        };
    } else {
        ctx.body = {
            errNo: 0,
            errStr: 'success',
            data: ''
        };
    }
});
router.post('/reset_password', async function(ctx, next) {
    let userCollection = database.collection('users');
    let { userName, password } = ctx.request.body;
    let userDoc = await userCollection.findOne({
        userName
    });
    let result = await userCollection.update({
        userName
    }, {
        $set: {
            password: password
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
            errStr: '密码重置失败，请稍后重试',
            data: ''
        };
    }
});
router.get('/get_address_list', async function(ctx, next) {
    let userCollection = database.collection('users');
    let userId = ctx.cookies.get('userId');
    let userDoc = await userCollection.findOne({
        userId
    });
    if (!userDoc) {
        ctx.body = {
            errNo: 1,
            errStr: '当前用户不存在',
            data: ''
        };
    } else {
        ctx.body = {
            errNo: 0,
            errStr: 'success',
            data: userDoc.addressList
        };
    }
});
router.post('/upload', avatarUpload.single('file'), async function(ctx, next) {
    ctx.body = {
        errNo: 0,
        errStr: 'success',
        data: ctx.req.file.filename
    };
});
router.get('/get_user_extra_data', async function(ctx, next) {
    let userCollection = database.collection('users');
    let userId = ctx.cookies.get('userId');
    let userDoc = await userCollection.findOne({ userId });
    if (!userDoc) {
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
                avatar: `${userDoc.imageHost}${userDoc.avatar}`,
                realName: userDoc.realName,
                sex: userDoc.sex ? parseInt(userDoc.sex) : '',
                birthday: parseInt(userDoc.birthday)
            }
        };
    }
});
router.post('/set_user_extra_data', async function(ctx, next) {
    let userCollection = database.collection('users');
    let { avatar, realName, sex, birthday } = ctx.request.body;
    let userId = ctx.cookies.get('userId');
    let result = await userCollection.update({ userId }, {
        $set: {
            avatar: config.avatarBasicPath + avatar,
            realName: realName,
            sex: sex,
            birthday: birthday
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
router.get('/get_email_phone', async function(ctx, next) {
    let userCollection = database.collection('users');
    let userId = ctx.cookies.get('userId');
    let userDoc = await userCollection.findOne({ userId });
    if (!userDoc) {
        ctx.body = {
            errNo: 10,
            errStr: '出错啦，请稍后重试',
            data: ''
        };
    } else {
        let emailLength = userDoc.email.split('@')[0].length;
        let len = emailLength > 4 ? 3 : 1;
        let rep = '';
        let repMax = Math.min(4, emailLength - len);
        for (let i = 0; i < repMax; i++) {
            rep += '*';
        }
        console.log(typeof userDoc.phone, typeof userDoc.email);
        ctx.body = {
            errNo: 0,
            errStr: 'success',
            data: {
                phone: `${userDoc.phone.substr(0, 3)}****${userDoc.phone.substr(6, 4)}`,
                email: `${userDoc.email.substr(0, len)}${rep}${userDoc.email.substr(
          len + repMax
        )}`
            }
        };
    }
});
router.post('/check_old_password', async function(ctx, next) {
    let userCollection = database.collection('users');
    let userId = ctx.cookies.get('userId');
    let password = ctx.request.body.oldPassword;
    let userDoc = await userCollection.findOne({
        userId
    });
    if (!userDoc) {
        ctx.body = {
            errNo: 1,
            errStr: '出错了，请稍后重试',
            data: ''
        };
    } else {
        if (userDoc.password === password) {
            ctx.body = {
                errNo: 0,
                errStr: 'success',
                data: ''
            };
        } else {
            ctx.body = {
                errNo: 1,
                errStr: '原密码错误，请重新输入',
                data: ''
            };
        }
    }
});
router.post('/modify_password', async function(ctx, next) {
    let userCollection = database.collection('users');
    let userId = ctx.cookies.get('userId');
    let password = ctx.request.body.newPassword;
    let result = await userCollection.update({
        userId
    }, {
        $set: {
            password
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
            errNo: 1,
            errStr: '出错了，请稍后重试',
            data: ''
        };
    }
});
router.post('/check_old_phone', async function(ctx, next) {
    let userCollection = database.collection('users');
    let userId = ctx.cookies.get('userId');
    let phone = ctx.request.body.oldPhone;
    let userDoc = await userCollection.findOne({
        userId
    });
    if (!userDoc) {
        ctx.body = {
            errNo: 1,
            errStr: '出错了，请稍后重试',
            data: ''
        };
    } else {
        if (userDoc.phone === phone) {
            ctx.body = {
                errNo: 0,
                errStr: 'success',
                data: ''
            };
        } else {
            ctx.body = {
                errNo: 1,
                errStr: '原手机错误，请重新输入',
                data: ''
            };
        }
    }
});
router.post('/modify_phone', async function(ctx, next) {
    let userCollection = database.collection('users');
    let userId = ctx.cookies.get('userId');
    let phone = ctx.request.body.newPhone;
    let result = await userCollection.update({
        userId
    }, {
        $set: {
            phone
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
            errNo: 1,
            errStr: '出错了，请稍后重试',
            data: ''
        };
    }
});
module.exports = router;