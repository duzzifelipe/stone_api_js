const { randomString } = require("../helpers")
const { post, get } = require("../rest")
const { loadConfig } = require("./set_config")
const jose = require('node-jose');

const handleRequestError = (step, error) => {
    if (error.response.status === 403 && error.response.data.type === "srn:error:challenge_required") {
        return { challengeId: error.response.data?.challenge?.id }

    } else {
        console.log(step, error.response.status, JSON.stringify(error.response.data))
        return null
    }
}

const encryptPin = async (challengeId, pin) => {
    const payload = JSON.stringify({
        challenge_id: challengeId,
        pin: pin
    })

    const keysResult = await get('/api/v1/discovery/keys')
    const keys = keysResult.data["keys"]
    const key = keys[keys.length - 1]
    const jwk = await jose.JWK.asKey(key)
    const kid = jwk.kid
    const jweConfig = { fields: { "alg": "RSA-OAEP-256", "enc": "A256GCM", "kid": kid }, format: 'compact' }

    return await jose.JWE.createEncrypt(jweConfig, key).update(payload).final()
}

const createPixPayment = async (key, amount, pin) => {
    const { accountId } = loadConfig()
    const transactionId = randomString(25)

    const createPayload = {
        account_id: accountId,
        amount: amount,
        transaction_id: transactionId,
        key: key
    }

    const confirmPayload = {
        add_target_to_contacts: false
    }

    const headers = { 'x-stone-idempotency-key': transactionId }
    const createResult = await post('/api/v1/pix/outbound_pix_payments', createPayload, headers).catch((error) => handleRequestError('create_pix', error))
    const stoneId = createResult.data.id

    const confirmResult = await post(`/api/v1/pix/outbound_pix_payments/${stoneId}/actions/confirm`, confirmPayload, headers).catch((error) => handleRequestError('confirm_pix', error))
    const target = {
        name: createResult.data.target.entity.name,
        document: createResult.data.target.entity.document,
        ispb: createResult.data.target.institution.ispb
    }

    if (confirmResult.challengeId) {
        const encryptedPin = await encryptPin(confirmResult.challengeId, pin)
        const pinHeaders = { ...headers, 'X-Stone-Challenge-Solution': encryptedPin }
        const reConfirmResult = await post(`/api/v1/pix/outbound_pix_payments/${stoneId}/actions/confirm`, confirmPayload, pinHeaders).catch((error) => handleRequestError('confirm_pix', error))

        if (reConfirmResult) {
            return { id: stoneId, transactionId, target }

        } else {
            return null
        }

    } else {
        return null
    }
}

const PIX_STATUSES = {
    'PENDING_APPROVAL': 'pending',
    'CONFIRMED': 'pending',
    'MONEY_RESERVED': 'pending',
    'SETTLED': 'sent',
    'CANCELLED': 'canceled',
    'REFUNDED': 'refunded'
}

const verifyPixPayment = async (id) => {
    const result = await get(`/api/v1/pix/outbound_pix_payments/${id}`).catch((error) => handleRequestError('verify', error))
    const status = PIX_STATUSES[result.data.status] || null
    console.log('verifyPixPayment', id , result.data.status, status)
    return status
}

module.exports = {
    create: createPixPayment,
    verify: verifyPixPayment
}