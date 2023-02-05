const cron = require('node-cron');
const jwt = require('jsonwebtoken')
const fs = require('fs');
const { default: axios } = require('axios');

const CLIENT_ID = 'abc_web@openbank.stone.com.br'
const API_URL = 'https://api.openbank.stone.com.br'
const FILE_NAME = '/tmp/stone_api_js_credentials.json'

const generateToken = async (accessToken, refreshToken, deviceId, platformId) => {
    console.log('  -> requesting token')
    const payload = {
        client_id: CLIENT_ID,
        grant_type: 'refresh_token',
        refresh_token: refreshToken
    }

    const config = {
        headers: {
            authorization: `Bearer ${accessToken}`,
            'content-type': 'application/json',
            'device-generated-id': deviceId,
            'platform-id': platformId
        }
    }

    const result = await axios.post(API_URL + '/api/v1/token', payload, config)

    console.log('  -> token returned')

    return {
        deviceId,
        platformId,
        accessToken: result.data.access_token,
        refreshToken: result.data.refresh_token
    }
}

const persistToken = (accessToken, refreshToken, deviceId, platformId) => {
    const payload = JSON.stringify({ accessToken, refreshToken, deviceId, platformId })
    fs.writeFileSync(FILE_NAME, payload)
}

const retrieveToken = () => {
    try {
        return JSON.parse(fs.readFileSync(FILE_NAME).toString())
    } catch (e) {
        return null
    }
}

const scheduledWorker = () => {
    console.log('check for token')

    const loadedToken = retrieveToken()

    if (!loadedToken) {
        console.log(' -> no token saved')
        return null
    }

    const decoded = jwt.decode(loadedToken.accessToken)
    const compareDate = (new Date().getTime()) / 1000 + (5 * 60)

    if (decoded.exp <= compareDate) {
        console.log(' -> token not valid')
        const newToken = generateToken(loadedToken.accessToken, loadedToken.refreshToken, loadedToken.deviceId, loadedToken.platformId)
        persistToken(newToken.accessToken, newToken.refreshToken, deviceId, platformId)

    } else {
        console.log(' -> token still valid')
    }
}

module.exports = {
    keepRefreshed: (accessToken, refreshToken, deviceId, platformId) => {
        persistToken(accessToken, refreshToken, deviceId, platformId)

        cron.schedule('* * * * *', scheduledWorker);
    },

    retrieveToken: retrieveToken
}