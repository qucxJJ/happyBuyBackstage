let config = {
    imageHost: 'http://localhost:3000',
    avatarBasicPath: '/images/user-avatar/',
    productPicBasicPath: '/images/product/',
    getProductPicUrl(name) {
        return `${this.imageHost}${this.productPicBasicPath}${name}`;
    }
};
module.exports = config;