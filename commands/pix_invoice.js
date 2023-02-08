const { post, get } = require("../rest")
const { loadConfig } = require("./set_config")

const RANDOM_CHARS = '0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ'

const randomString = (length) => {
    var result = '';
    for (var i = length; i > 0; --i) result += RANDOM_CHARS[Math.floor(Math.random() * RANDOM_CHARS.length)];
    return result;
}

const handleRequestError = (error) => {
    console.log(error.response.status, JSON.stringify(error.response.data))
    return null
}

const createInvoice = async (amount, key) => {
    const { accountId } = loadConfig()
    const transactionId = randomString(32)

    const payload = {
        amount: amount,
        account_id: accountId,
        key: key,
        transaction_id: transactionId
    }

    const result = await post('/api/v1/pix_payment_invoices', payload, { 'x-stone-idempotency-key': transactionId }).catch(handleRequestError)

    if (!result) {
        return null
    }

    return {
        id: result.data.id,
        address: result.data.qr_code_content,
    }
}

const verifyInvoice = async (id) => {
    const result = await get(`/api/v1/pix_payment_invoices/${id}`)
    console.log(result.response.data)
}

module.exports = {
    create: createInvoice,
    verify: verifyInvoice
}