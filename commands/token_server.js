const cron = require('node-cron');
const jwt = require('jsonwebtoken')
const { post } = require('../rest');
const { writeConfig, loadConfig } = require('./set_config');
const { createLogger } = require('../logger')

const logger = createLogger('commands:token_server')

const CLIENT_ID = 'abc_web@openbank.stone.com.br'

const handleRequestError = (error) => {
    logger.error(error.response.status, JSON.stringify(error.response.data))
    return null
}

const generateToken = async (refreshToken) => {
    logger.info('requesting new token')
    const payload = {
        client_id: CLIENT_ID,
        grant_type: 'refresh_token',
        refresh_token: refreshToken
    }

    const result = await post('/api/v1/token', payload).catch(handleRequestError)

    if (!result) {
        return null
    }

    logger.info('new token returned')

    return {
        accessToken: result.data.access_token,
        refreshToken: result.data.refresh_token
    }
}

const scheduledWorker = async () => {
    logger.debug('check for token')

    const loadedConfig = loadConfig()

    if (!loadedConfig) {
        logger.warn('no token saved')
        return null
    }

    const decoded = jwt.decode(loadedConfig.accessToken)
    const compareDate = (new Date().getTime()) / 1000 + (5 * 60)

    if (decoded.exp <= compareDate) {
        logger.info('token expired')
        const newToken = await generateToken(loadedConfig.refreshToken)

        if (newToken) {
            writeConfig({...loadedConfig, ...newToken})
        }

    } else {
        logger.debug('token still valid')
    }
}

module.exports = {
    keepRefreshed: (accountId, accessToken, refreshToken, deviceId, platformId) => {
        writeConfig({ accountId, accessToken, refreshToken, deviceId, platformId })

        cron.schedule('* * * * *', scheduledWorker);
    }
}