const RANDOM_CHARS = '0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ'

module.exports = {
    randomString: (length) => {
        var result = '';
        for (var i = length; i > 0; --i) result += RANDOM_CHARS[Math.floor(Math.random() * RANDOM_CHARS.length)];
        return result;
    }
}