import { Router } from 'express'
import { z } from 'zod'
import { env, paystackEnabled } from '../config/env.ts'
import { generateOrderReference } from '../lib/codes.ts'
import { failOrder, fulfilOrder } from '../lib/fulfilment.ts'
import { ApiError, asyncHandler } from '../lib/http.ts'
import { HOLD_MINUTES, releaseSeats, reserveSeats } from '../lib/inventory.ts'
import { initializeTransaction, verifyTransaction } from '../lib/paystack.ts'
import { Event } from '../models/Event.ts'
import { Order } from '../models/Order.ts'
import { Ticket } from '../models/Ticket.ts'

const router = Router()

const checkoutSchema = z.object({
  eventSlug: z.string().min(1, 'Pick an event'),
  customer: z.object({
    name: z.string().min(2, 'Enter your full name').max(120),
    email: z.string().email('Enter a valid email address'),
    phone: z.string().max(30).optional().default(''),
  }),
  items: z
    .array(
      z.object({
        ticketTypeId: z.string().min(1),
        quantity: z.number().int().min(1).max(20),
      }),
    )
    .min(1, 'Select at least one ticket'),
})

function ticketSummary(ticket: { code: string; ticketTypeName: string; eventTitle: string }) {
  return {
    code: ticket.code,
    ticketType: ticket.ticketTypeName,
    eventTitle: ticket.eventTitle,
  }
}

/**
 * POST /api/checkout/initialize
 * Holds the seats, creates a pending order, and hands back a Paystack URL.
 */
router.post(
  '/initialize',
  asyncHandler(async (req, res) => {
    const payload = checkoutSchema.parse(req.body)

    const event = await Event.findOne({
      slug: payload.eventSlug.toLowerCase(),
      status: 'published',
    })
    if (!event) throw ApiError.notFound('We could not find that event')

    const finishesAt = event.endsAt ?? event.startsAt
    if (finishesAt.getTime() < Date.now()) {
      throw ApiError.conflict('This event has already taken place')
    }

    // Collapse duplicate lines so per-order limits cannot be dodged.
    const merged = new Map<string, number>()
    for (const item of payload.items) {
      merged.set(item.ticketTypeId, (merged.get(item.ticketTypeId) ?? 0) + item.quantity)
    }
    const requests = [...merged].map(([ticketTypeId, quantity]) => ({ ticketTypeId, quantity }))

    const lines = await reserveSeats(event._id, requests)
    const subtotal = lines.reduce((sum, line) => sum + line.subtotal, 0)
    const reference = generateOrderReference()

    let order
    try {
      order = await Order.create({
        reference,
        event: event._id,
        eventTitle: event.title,
        eventStartsAt: event.startsAt,
        customer: payload.customer,
        items: lines,
        subtotal,
        total: subtotal,
        currency: env.paystack.currency,
        status: 'pending',
        stockReserved: true,
        holdExpiresAt: new Date(Date.now() + HOLD_MINUTES * 60 * 1000),
      })
    } catch (error) {
      // No order exists to hang the hold on, so hand the seats back directly.
      for (const line of lines) {
        await releaseSeats(event._id, line.ticketTypeId, line.quantity)
      }
      throw error
    }

    // Comped or free-entry events skip Paystack entirely.
    if (subtotal <= 0) {
      const { tickets } = await fulfilOrder(order, { channel: 'free', paidAt: new Date() })
      res.status(201).json({
        success: true,
        data: {
          reference: order.reference,
          free: true,
          authorizationUrl: null,
          tickets: tickets.map(ticketSummary),
        },
      })
      return
    }

    if (!paystackEnabled) {
      await failOrder(order, 'cancelled')
      throw new ApiError(503, 'Card payments are not switched on yet. Please contact us to book.')
    }

    try {
      const paystack = await initializeTransaction({
        email: payload.customer.email,
        amount: subtotal,
        reference: order.reference,
        callbackUrl: `${env.clientUrl}/tickets/confirm`,
        metadata: {
          orderId: String(order._id),
          eventSlug: event.slug,
          eventTitle: event.title,
          customerName: payload.customer.name,
          custom_fields: [
            { display_name: 'Event', variable_name: 'event', value: event.title },
            {
              display_name: 'Tickets',
              variable_name: 'tickets',
              value: lines.map((line) => `${line.quantity} x ${line.name}`).join(', '),
            },
          ],
        },
      })

      order.paystack.reference = paystack.reference
      order.paystack.accessCode = paystack.accessCode
      order.paystack.authorizationUrl = paystack.authorizationUrl
      await order.save()

      res.status(201).json({
        success: true,
        data: {
          reference: order.reference,
          free: false,
          authorizationUrl: paystack.authorizationUrl,
          accessCode: paystack.accessCode,
          publicKey: env.paystack.publicKey,
          total: subtotal,
          currency: order.currency,
          expiresAt: order.holdExpiresAt,
        },
      })
    } catch (error) {
      await failOrder(order)
      throw error
    }
  }),
)

/**
 * GET /api/checkout/verify/:reference
 * Called when the buyer returns from Paystack. Authoritative either way: it
 * asks Paystack directly rather than trusting the redirect.
 */
router.get(
  '/verify/:reference',
  asyncHandler(async (req, res) => {
    const order = await Order.findOne({ reference: req.params.reference })
    if (!order) throw ApiError.notFound('We could not find that order')

    if (order.status === 'paid') {
      const tickets = await Ticket.find({ order: order._id }).sort({ createdAt: 1 })
      res.json({
        success: true,
        data: {
          status: 'paid',
          reference: order.reference,
          eventTitle: order.eventTitle,
          total: order.total,
          currency: order.currency,
          customer: order.customer,
          tickets: tickets.map(ticketSummary),
        },
      })
      return
    }

    const verification = await verifyTransaction(order.reference)

    if (verification.status !== 'success') {
      if (verification.status === 'failed' || verification.status === 'abandoned') {
        await failOrder(order)
      }
      res.json({
        success: true,
        data: { status: verification.status, reference: order.reference, tickets: [] },
      })
      return
    }

    // Never issue tickets for less money than the order asked for.
    if (verification.amount < order.total) {
      throw ApiError.badRequest('The amount paid does not match this order. Please contact us.')
    }

    const { tickets } = await fulfilOrder(order, {
      reference: verification.reference,
      channel: verification.channel,
      paidAt: verification.paidAt ? new Date(verification.paidAt) : new Date(),
      raw: verification.raw,
    })

    res.json({
      success: true,
      data: {
        status: 'paid',
        reference: order.reference,
        eventTitle: order.eventTitle,
        total: order.total,
        currency: order.currency,
        customer: order.customer,
        tickets: tickets.map(ticketSummary),
      },
    })
  }),
)

export default router
