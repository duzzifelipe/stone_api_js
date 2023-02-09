const { default: axios } = require('axios');
const { loadConfig } = require('./commands/set_config')

const API_URL = 'https://api.openbank.stone.com.br'

const restConfig = (extraHeaders) => {
    const { accessToken, deviceId, platformId } = loadConfig()

    let headers = {
        authorization: `Bearer ${accessToken}`,
        'content-type': 'application/json',
        'device-generated-id': deviceId,
        'platform-id': platformId,
        authority: 'api.openbank.stone.com.br',
        origin: 'https://conta.stone.com.br',
        referer: 'https://conta.stone.com.br/',
        'user-agent': 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/109.0.0.0 Safari/537.36'
    }

    if (extraHeaders) {
        headers = { ...headers, ...extraHeaders }
    }

    return { headers }
}

module.exports = {
    post: (path, payload, extraHeaders) => {
        return axios.post(API_URL + path, payload, restConfig(extraHeaders))
    },

    get: (path) => {
        return axios.get(API_URL + path, restConfig())
    }
}