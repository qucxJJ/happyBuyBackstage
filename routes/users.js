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
    let userId = parseInt(ctx.cookies.get('userId'));
    if (!userId) {
        ctx.body = {
            errNo: 11,
            errStr: '用户未登录,无法获取当前用户的信息'
        };
        return;
    }
    let userDoc = await userCollection.findOne({
        userId
    });
    if (!userDoc) {
        ctx.body = {
            errNo: 10,
            errStr: '出错啦，请稍后重试',
            data: ''
        };
    } else {
        let userInfo = {};
        userInfo.userName = userDoc.userName;
        userInfo.cartNum = userDoc.cartList.length;
        userInfo.avatar = `${config.imageHost}${config.avatarBasicPath}${
      userDoc.avatar
    }`;
        ctx.body = {
            errNo: 0,
            errStr: 'success',
            data: userInfo
        };
    }
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
        let userId = userDoc.length ?
            parseInt(userDoc[userDoc.length - 1].userId) + 1 :
            100000001;
        let result = await userCollection.insertOne({
            userId,
            userName,
            password,
            phone,
            email,
            question,
            answer,
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
    if (!userDoc) {
        ctx.body = {
            errNo: 10,
            errStr: '出错啦，请稍后重试',
            data: ''
        };
    } else {
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
    }
});
router.post('/reset_password', async function(ctx, next) {
    let userCollection = database.collection('users');
    let { userName, password } = ctx.request.body;
    let userDoc = await userCollection.findOne({
        userName
    });
    if (!userDoc) {
        ctx.body = {
            errNo: 10,
            errStr: '出错啦，请稍后重试',
            data: ''
        };
        return;
    }
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
    let userId = parseInt(ctx.cookies.get('userId'));
    let userDoc = await userCollection.findOne({
        userId
    });
    if (!userDoc) {
        ctx.body = {
            errNo: 10,
            errStr: '出错啦，请稍后重试',
            data: ''
        };
    } else {
        let list = userDoc.addressList;
        if (list.length) {
            let defaultIndex = list.findIndex(item => {
                return item.default === 1;
            });
            let defaultAaddress = list.splice(defaultIndex, 1);
            list.unshift(defaultAaddress[0]);
        }
        ctx.body = {
            errNo: 0,
            errStr: 'success',
            data: list
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
    let userId = parseInt(ctx.cookies.get('userId'));
    let userDoc = await userCollection.findOne({
        userId
    });
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
                avatar: {
                    name: userDoc.avatar,
                    url: `${config.imageHost}${config.avatarBasicPath}${userDoc.avatar}`
                },
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
    let userId = parseInt(ctx.cookies.get('userId'));
    let result = await userCollection.update({
        userId
    }, {
        $set: {
            avatar: avatar,
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
    let userId = parseInt(ctx.cookies.get('userId'));
    let userDoc = await userCollection.findOne({
        userId
    });
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
    let userId = parseInt(ctx.cookies.get('userId'));
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
    let userId = parseInt(ctx.cookies.get('userId'));
    let password = ctx.request.body.newPassword;
    let userDoc = await userCollection.findOne({
        userId
    });
    if (!userDoc) {
        ctx.body = {
            errNo: 10,
            errStr: '出错了，请稍后重试',
            data: ''
        };
        return;
    } else {
        if (userDoc.password === password) {
            ctx.body = {
                errNo: 1,
                errStr: '新密码不能与原密码相同',
                data: ''
            };
            return;
        }
    }
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
            errNo: 10,
            errStr: '出错了，请稍后重试',
            data: ''
        };
    }
});
router.post('/check_old_phone', async function(ctx, next) {
    let userCollection = database.collection('users');
    let userId = parseInt(ctx.cookies.get('userId'));
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
    let userId = parseInt(ctx.cookies.get('userId'));
    let phone = ctx.request.body.newPhone;
    let userDoc = await userCollection.findOne({
        userId
    });
    if (!userDoc) {
        ctx.body = {
            errNo: 10,
            errStr: '出错了，请稍后重试',
            data: ''
        };
    } else {
        if (userDoc.phone === phone) {
            ctx.body = {
                errNo: 2,
                errStr: '新手机号不能与原来的手机号相同',
                data: ''
            };
            return;
        }
    }
    let phoneUser = await userCollection.findOne({
        phone
    });
    if (phoneUser) {
        ctx.body = {
            errNo: 1,
            errStr: '该手机号已经被绑定',
            data: ''
        };
        return;
    }
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
            errNo: 10,
            errStr: '出错了，请稍后重试',
            data: ''
        };
    }
});
router.post('/check_old_email', async function(ctx, next) {
    let userCollection = database.collection('users');
    let userId = parseInt(ctx.cookies.get('userId'));
    let email = ctx.request.body.oldEmail;
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
        if (userDoc.email === email) {
            ctx.body = {
                errNo: 0,
                errStr: 'success',
                data: ''
            };
        } else {
            ctx.body = {
                errNo: 1,
                errStr: '原邮箱错误，请重新输入',
                data: ''
            };
        }
    }
});
router.post('/modify_email', async function(ctx, next) {
    let userCollection = database.collection('users');
    let userId = parseInt(ctx.cookies.get('userId'));
    let email = ctx.request.body.newEmail;
    let userDoc = await userCollection.findOne({
        userId
    });
    if (!userDoc) {
        ctx.body = {
            errNo: 10,
            errStr: '出错了，请稍后重试',
            data: ''
        };
    } else {
        if (userDoc.email === email) {
            ctx.body = {
                errNo: 2,
                errStr: '新邮箱不能与原来的邮箱相同',
                data: ''
            };
            return;
        }
    }
    let emailUser = await userCollection.findOne({
        email
    });
    if (emailUser) {
        ctx.body = {
            errNo: 1,
            errStr: '该邮箱已经被绑定',
            data: ''
        };
        return;
    }
    let result = await userCollection.update({
        userId
    }, {
        $set: {
            email
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
            errStr: '出错了，请稍后重试',
            data: ''
        };
    }
});
router.get('/get_old_question', async function(ctx, next) {
    let userCollection = database.collection('users');
    let userId = parseInt(ctx.cookies.get('userId'));
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
        ctx.body = {
            errNo: 0,
            errStr: 'success',
            data: userDoc.question
        };
    }
});
router.post('/check_old_answer', async function(ctx, next) {
    let userCollection = database.collection('users');
    let userId = parseInt(ctx.cookies.get('userId'));
    let answer = ctx.request.body.oldAnswer;
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
        if (userDoc.answer === answer) {
            ctx.body = {
                errNo: 0,
                errStr: 'success',
                data: ''
            };
        } else {
            ctx.body = {
                errNo: 1,
                errStr: '答案错误，请重新输入',
                data: ''
            };
        }
    }
});
router.post('/modify_question_and_answer', async function(ctx, next) {
    let userCollection = database.collection('users');
    let userId = parseInt(ctx.cookies.get('userId'));
    let { question, answer } = ctx.request.body;
    let userDoc = await userCollection.findOne({
        userId
    });
    if (!userDoc) {
        ctx.body = {
            errNo: 10,
            errStr: '出错了，请稍后重试',
            data: ''
        };
        return;
    } else {
        if (userDoc.question === question) {
            ctx.body = {
                errNo: 1,
                errStr: '新安全问题不能与原来的相同',
                data: ''
            };
            return;
        }
    }
    let result = await userCollection.update({
        userId
    }, {
        $set: {
            question,
            answer
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
            errStr: '出错了，请稍后重试',
            data: ''
        };
    }
});
router.post('/add_new_address', async function(ctx, next) {
    let userCollection = database.collection('users');
    let userId = parseInt(ctx.cookies.get('userId'));
    let {
        receiveName,
        receivePhone,
        postCode,
        province,
        city,
        county,
        detailArea,
        addressDetail
    } = ctx.request.body;
    let userDoc = await userCollection.findOne({
        userId
    });
    if (!userDoc) {
        ctx.body = {
            errNo: 10,
            errStr: '出错了，请稍后重试',
            data: ''
        };
        return;
    } else {
        let addressId = userDoc.addressList.length ?
            userDoc.addressList[userDoc.addressList.length - 1].addressId + 1 :
            1;
        let result = await userCollection.update({
            userId
        }, {
            $push: {
                addressList: {
                    addressId,
                    receiveName,
                    receivePhone,
                    postCode,
                    province: parseInt(province),
                    city: parseInt(city),
                    county: parseInt(county),
                    detailArea,
                    addressDetail,
                    default: userDoc.addressList.length ? 0 : 1
                }
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
                errStr: '出错了，请稍后重试',
                data: ''
            };
        }
    }
});
router.post('/set_default_address', async function(ctx, next) {
    let userCollection = database.collection('users');
    let userId = parseInt(ctx.cookies.get('userId'));
    let addressId = parseInt(ctx.request.body.addressId);
    let userDoc = await userCollection.findOne({
        userId
    });
    if (!userDoc) {
        ctx.body = {
            errNo: 10,
            errStr: '出错了，请稍后重试',
            data: ''
        };
        return;
    } else {
        let result = await userCollection.update({
            userId,
            'addressList.default': 1
        }, {
            $set: {
                'addressList.$.default': 0
            }
        });
        let result2 = await userCollection.update({
            userId,
            'addressList.addressId': addressId
        }, {
            $set: {
                'addressList.$.default': 1
            }
        });
        result = JSON.parse(result);
        result2 = JSON.parse(result2);
        if (result.ok && result2.ok) {
            ctx.body = {
                errNo: 0,
                errStr: 'success',
                data: ''
            };
        } else {
            ctx.body = {
                errNo: 10,
                errStr: '出错了，请稍后重试',
                data: ''
            };
        }
    }
});
router.post('/edit_address_info', async function(ctx, next) {
    let userCollection = database.collection('users');
    let userId = parseInt(ctx.cookies.get('userId'));
    let addressId = parseInt(ctx.request.body.addressId);
    let {
        receiveName,
        receivePhone,
        province,
        city,
        county,
        detailArea,
        addressDetail,
        postCode
    } = ctx.request.body;
    let userDoc = await userCollection.findOne({
        userId
    });
    if (!userDoc) {
        ctx.body = {
            errNo: 10,
            errStr: '出错了，请稍后重试',
            data: ''
        };
        return;
    } else {
        let result = await userCollection.update({
            userId,
            'addressList.addressId': addressId
        }, {
            $set: {
                'addressList.$.receiveName': receiveName,
                'addressList.$.receivePhone': receivePhone,
                'addressList.$.province': parseInt(province),
                'addressList.$.city': parseInt(city),
                'addressList.$.county': parseInt(county),
                'addressList.$.detailArea': detailArea,
                'addressList.$.addressDetail': addressDetail,
                'addressList.$.postCode': postCode
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
                errStr: '出错了，请稍后重试',
                data: ''
            };
        }
    }
});
router.post('/delete_address', async function(ctx, next) {
    let userCollection = database.collection('users');
    let userId = parseInt(ctx.cookies.get('userId'));
    let addressId = parseInt(ctx.request.body.addressId);
    let userDoc = await userCollection.findOne({
        userId
    });
    if (!userDoc) {
        ctx.body = {
            errNo: 10,
            errStr: '出错了，请稍后重试',
            data: ''
        };
        return;
    } else {
        let targetIndex = userDoc.addressList.findIndex(item => {
            return item.addressId === addressId;
        });
        if (
            userDoc.addressList.length > 1 &&
            userDoc.addressList[targetIndex].default === 1
        ) {
            let result = await userCollection.update({
                userId
            }, {
                $pull: {
                    addressList: {
                        addressId
                    }
                }
            });
            let user = await userCollection.findOne({
                userId
            });
            let newDefaultId = user.addressList[0].addressId;
            let result2 = await userCollection.update({
                userId,
                'addressList.addressId': newDefaultId
            }, {
                $set: {
                    'addressList.$.default': 1
                }
            });
            result = JSON.parse(result);
            result2 = JSON.parse(result2);
            if (result.ok && result2.ok) {
                ctx.body = {
                    errNo: 0,
                    errStr: 'success',
                    data: ''
                };
            } else {
                ctx.body = {
                    errNo: 10,
                    errStr: '出错了，请稍后重试',
                    data: ''
                };
            }
        } else {
            let result = await userCollection.update({
                userId
            }, {
                $pull: {
                    addressList: {
                        addressId
                    }
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
                    errStr: '出错了，请稍后重试',
                    data: ''
                };
            }
        }
    }
});
router.get('/get_foot_list', async function(ctx, next) {
    let userCollection = database.collection('users');
    let userId = parseInt(ctx.cookies.get('userId'));
    let userDoc = await userCollection.findOne({
        userId
    });
    if (!userId) {
        ctx.body = {
            errNo: 10,
            errStr: '出错啦，请稍后重试',
            data: ''
        };
    } else {
        ctx.body = {
            errNo: 0,
            errStr: 'success',
            data: userDoc.footList.map(item => {
                return {
                    productId: item.productId,
                    productName: item.productName,
                    price: item.price,
                    mainImage: config.getProductPicUrl(item.mainImage)
                };
            })
        };
    }
});
router.post('/delete_from_foot_list', async function(ctx, next) {
    let userCollection = database.collection('users');
    let userId = parseInt(ctx.cookies.get('userId'));
    let productId = parseInt(ctx.request.body.productId);
    let userDoc = await userCollection.findOne({
        userId
    });
    if (!userId) {
        ctx.body = {
            errNo: 10,
            errStr: '出错啦，请稍后重试',
            data: ''
        };
    } else {
        let result = await userCollection.update({
            userId
        }, {
            $pull: {
                footList: {
                    productId
                }
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
    }
});
router.post('/toggle_collection_status', async function(ctx, next) {
    let userCollection = database.collection('users');
    let productCollection = database.collection('products');
    let userId = parseInt(ctx.cookies.get('userId'));
    let productId = parseInt(ctx.request.body.productId);
    let userDoc = await userCollection.findOne({
        userId
    });
    if (!userId) {
        ctx.body = {
            errNo: 10,
            errStr: '出错啦，请稍后重试',
            data: ''
        };
    } else {
        let index = userDoc.collectionList.findIndex(item => {
            return item.productId === productId;
        });
        let result;
        if (index > -1) {
            result = await userCollection.update({
                userId
            }, {
                $pull: {
                    collectionList: {
                        productId
                    }
                }
            });
        } else {
            let productDoc = await productCollection.findOne({
                productId
            });
            result = await userCollection.update({
                userId
            }, {
                $push: {
                    collectionList: {
                        productId,
                        productNmae: productDoc.productName,
                        price: productDoc.price,
                        mainImage: productDoc.mainImage
                    }
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
    }
});
router.post('/add_to_cart', async function(ctx, next) {
    let userCollection = database.collection('users');
    let productCollection = database.collection('products');
    let userId = parseInt(ctx.cookies.get('userId'));
    let { productId, num, size, attr } = ctx.request.body;
    productId = parseInt(productId);
    num = parseInt(num);
    let userDoc = await userCollection.findOne({
        userId
    });
    let productIndex = userDoc.cartList.findIndex(item => {
        return (
            item.productId === productId && item.size === size && item.attr === attr
        );
    });
    let result;
    if (productIndex > -1) {
        result = await userCollection.update({
            userId,
            'cartList.productId': productId,
            'cartList.attr': attr,
            'cartList.size': size
        }, {
            $set: {
                'cartList.$.num': userDoc.cartList[productIndex].num + num
            }
        });
    } else {
        let productDoc = await productCollection.findOne({
            productId
        });
        let id = userDoc.cartList.length ?
            userDoc.cartList[userDoc.cartList.length - 1].id + 1 :
            1;
        let attrIndex = productDoc.attributes.findIndex(item => {
            return item.name === attr;
        });
        result = await userCollection.update({
            userId
        }, {
            $push: {
                cartList: {
                    id: id,
                    productId,
                    productName: productDoc.productName,
                    price: productDoc.price,
                    pic: productDoc.attributes[attrIndex].image,
                    num,
                    size,
                    attr
                }
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
router.get('/get_cart_list', async function(ctx, next) {
    let userCollection = database.collection('users');
    let userId = parseInt(ctx.cookies.get('userId'));
    if (!userId) {
        ctx.body = {
            errNo: 11,
            errStr: '用户未登录',
            data: ''
        };
        return;
    }
    let userDoc = await userCollection.findOne({
        userId
    });
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
            data: userDoc.cartList.map(item => {
                return {
                    id: item.id,
                    productId: item.productId,
                    productName: item.productName,
                    price: item.price,
                    pic: config.getProductPicUrl(item.pic),
                    num: item.num,
                    size: item.size,
                    attr: item.attr,
                    checked: 0,
                    totalPrice: item.price * item.num
                };
            })
        };
    }
});
router.post('/modify_cart_product_num', async function(ctx, next) {
    let userCollection = database.collection('users');
    let productCollection = database.collection('products');
    let userId = parseInt(ctx.cookies.get('userId'));
    let { id, productId, type } = ctx.request.body;
    id = parseInt(id);
    productId = parseInt(productId);
    if (!userId) {
        ctx.body = {
            errNo: 11,
            errStr: '用户未登录',
            data: ''
        };
        return;
    }
    let userDoc = await userCollection.findOne({
        userId
    });
    if (!userDoc) {
        ctx.body = {
            errNo: 10,
            errStr: '出错啦，请稍后重试',
            data: ''
        };
    } else {
        let proDoc = await productCollection.findOne({
            productId
        });
        let dataIndex = userDoc.cartList.findIndex(item => {
            return item.id === id;
        });
        let oldNum = userDoc.cartList[dataIndex].num;
        let num;
        if (type === 'plus') {
            num = oldNum < proDoc.stockNum ? oldNum + 1 : oldNum;
        } else {
            num = oldNum > 1 ? oldNum - 1 : oldNum;
        }
        console.log(type);
        let result = await userCollection.update({
            userId,
            'cartList.id': id
        }, {
            $set: {
                'cartList.$.num': num
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
    }
});
router.post('/delete_from_cart', async function(ctx, next) {
    let userCollection = database.collection('users');
    let userId = parseInt(ctx.cookies.get('userId'));
    let ids = ctx.request.body.ids;
    for (let i = 0; i < ids.length; i++) {
        ids[i] = parseInt(ids[i]);
        console.log(ids[i], typeof ids[i]);
    }
    let userDoc = await userCollection.findOne({
        userId
    });
    let result;
    for (let i = 0; i < ids.length; i++) {
        result = await userCollection.update({
            userId
        }, {
            $pull: {
                cartList: {
                    id: ids[i]
                }
            }
        });
        result = JSON.parse(result);
        if (!result.ok) {
            ctx.body = {
                errNo: 10,
                errStr: '出错啦，请稍后重试',
                data: ''
            };
            return;
        }
    }
    ctx.body = {
        errNo: 0,
        errStr: 'success',
        data: ''
    };
});
module.exports = router;