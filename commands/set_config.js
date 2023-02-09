const fs = require('fs')
const FILE_NAME = '/tmp/stone_api_js_credentials.json'

module.exports = {
    loadConfig: () => {
        try {
            return JSON.parse(fs.readFileSync(FILE_NAME).toString())
        } catch (e) {
            return null
        }
    },
    writeConfig: (config) => {
        if (config.accountId && config.accessToken && config.refreshToken && config.deviceId && config.platformId) {
            fs.writeFileSync(FILE_NAME, JSON.stringify(config))
        }
    }
}