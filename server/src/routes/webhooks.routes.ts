import { Router } from 'express'
import { failOrder, fulfilOrder } from '../lib/fulfilment.ts'
import { verifyWebhookSignature } from '../lib/paystack.ts'
import { Order } from '../models/Order.ts'

const router = Router()

/**
 * POST /api/webhooks/paystack
 *
 * Mounted with a raw body parser so the HMAC is computed over the exact bytes
 * Paystack signed. Always answers 200 once the signature checks out, because a
 * non-2xx makes Paystack retry an event we have already handled.
 */
router.post('/paystack', async (req, res) => {
  const rawBody: Buffer = Buffer.isBuffer(req.body) ? req.body : Buffer.from(String(req.body ?? ''))

  if (!verifyWebhookSignature(rawBody, req.headers['x-paystack-signature'] as string | undefined)) {
    res.status(401).json({ success: false, message: 'Invalid signature' })
    return
  }

  let event: { event?: string; data?: Record<string, any> }
  try {
    event = JSON.parse(rawBody.toString('utf8'))
  } catch {
    res.status(400).json({ success: false, message: 'Malformed payload' })
    return
  }

  res.status(200).json({ success: true })

  // Everything past this point is best-effort background work.
  try {
    const reference = event.data?.reference
    if (!reference) return

    const order = await Order.findOne({ reference })
    if (!order) {
      console.warn(`[webhook] no order for reference ${reference}`)
      return
    }

    if (event.event === 'charge.success') {
      const paidAmount = Number(event.data?.amount ?? 0) / 100
      if (paidAmount < order.total) {
        console.warn(`[webhook] underpayment on ${reference}: ${paidAmount} < ${order.total}`)
        return
      }

      const { alreadyFulfilled } = await fulfilOrder(order, {
        reference,
        channel: event.data?.channel ?? null,
        paidAt: event.data?.paid_at ? new Date(event.data.paid_at) : new Date(),
        raw: event.data,
      })

      console.log(
        `[webhook] ${reference} ${alreadyFulfilled ? 'already fulfilled' : 'tickets issued'}`,
      )
      return
    }

    if (event.event === 'charge.failed') {
      await failOrder(order)
      console.log(`[webhook] ${reference} marked failed, seats released`)
    }
  } catch (error) {
    console.error('[webhook] processing error:', error)
  }
})

export default router
