# Getting information for token server

Run the following code in a logged page:

```javascript
const getLocalStorage = name => {
    const raw = localStorage.getItem(name) || localStorage.getItem(name.replaceAll('-', '::'))
    const parsed = JSON.parse(raw)
    return parsed.data
}

const getCookie = name => {
  const value = `; ${document.cookie}`;
  const parts = value.split(`; ${name}=`);
  if (parts.length === 2) return parts.pop().split(';').shift();
}

const deviceId = getLocalStorage('device-generated-id')
const platformId = getLocalStorage('platform-id')
const accessToken = getCookie('token')
const refreshToken = getCookie('refreshToken')
const accountId = getCookie('accountId')

console.log(JSON.stringify({accountId, deviceId, platformId, accessToken, refreshToken}))
```