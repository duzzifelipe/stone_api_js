const winston = require('winston')

const config = winston.createLogger({
    format: winston.format.combine(
        winston.format.json(),
        winston.format.timestamp(),
    )
});

config.add(new winston.transports.Console({
    level: 'debug',
    format: winston.format.simple(),
}));

module.exports = {
    createLogger: (namespace) => {
        return config.child({ namespace: `stone_api_js:${namespace}` })
    }
}
