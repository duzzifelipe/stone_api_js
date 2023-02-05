const puppeteer = require('puppeteer')
const uuid = require('uuid')

const PAGE_URL = 'https://conta.stone.com.br/'

module.exports = async (email, password) => {
    const platformId = uuid.v4();
    const deviceId = uuid.v4();

    const browser = await puppeteer.launch({ headless: true })
    const page = await browser.newPage()
    await page.setViewport({ width: 1080, height: 1024 });
    await page.goto(PAGE_URL)

    await page.evaluate((deviceId, platformId) => {
        localStorage.setItem('device-generated-id', JSON.stringify({ "data": deviceId, "crypto": false }))
        localStorage.setItem('platform-id', JSON.stringify({ "data": platformId, "crypto": false }));
        localStorage.setItem('device::generated::id', JSON.stringify({ "data": deviceId, "crypto": false }))
        localStorage.setItem('platform::id', JSON.stringify({ "data": platformId, "crypto": false }));
    }, deviceId, platformId);

    await page.type('form #username', email);
    await page.type('form #password', password);
    await page.click('form button')

    console.log('waiting for device confirmation')

    await page.waitForFunction("document.querySelector('p[data-cy=\"name-profile\"]') && document.querySelector('p[data-cy=\"name-profile\"]').clientHeight != 0", { timeout: 0 });

    const cookies = await page.cookies(PAGE_URL)
    const accessToken = cookies.find(e => e.name === 'token').value
    const refreshToken = cookies.find(e => e.name === 'refreshToken').value

    await page.close()
    await browser.close()

    console.log(`
LOGGED IN:

accessToken: ${accessToken}
refreshToken: ${refreshToken}
deviceId: ${deviceId}
platformId: ${platformId}`)

    return { accessToken, refreshToken, platformId, deviceId }
}