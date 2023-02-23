const { randomString } = require("../helpers")
const { post, get } = require("../rest")
const { loadConfig } = require("./set_config")
const { createLogger } = require('../logger')

const logger = createLogger('commands:pix_invoice')

const handleRequestError = (error) => {
    logger.error(error.response.status, JSON.stringify(error.response.data))
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
        transactionId
    }
}

const verifyInvoice = async (id) => {
    const result = await get(`/api/v1/pix_payment_invoices/${id}`)

    return { is_paid: result.data.status === 'PAID' }
}

module.exports = {
    create: createInvoice,
    verify: verifyInvoice
}