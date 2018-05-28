let config = {
    imageHost: 'http://localhost:3000',
    avatarBasicPath: '/images/user-avatar/',
    productPicBasicPath: '/images/product/',
    expressPicBasicPath: '/images/express/',
    evalBasicPath: '/images/evals/',
    getAvatarUrl(name) {
        return `${this.imageHost}${this.avatarBasicPath}${name}`;
    },
    getProductPicUrl(name) {
        return `${this.imageHost}${this.productPicBasicPath}${name}`;
    },
    getExpressPicUrl(name) {
        return `${this.imageHost}${this.expressPicBasicPath}${name}`;
    },
    getEvalPicPath(name) {
        return `${this.imageHost}${this.evalBasicPath}${name}`;
    },
    getSecretCode(userName) {
        return `shopping-so-happy${userName}`;
    }
};
module.exports = config;