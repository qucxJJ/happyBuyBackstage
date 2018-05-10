let config = {
    imageHost: 'http://localhost:3000',
    avatarBasicPath: '/images/user-avatar/',
    productPicBasicPath: '/images/product/',
    expressPicBasicPath: '/images/express/',
    getProductPicUrl(name) {
        return `${this.imageHost}${this.productPicBasicPath}${name}`;
    },
    getExpressPicUrl(name) {
        return `${this.imageHost}${this.expressPicBasicPath}${name}`;
    }
};
module.exports = config;