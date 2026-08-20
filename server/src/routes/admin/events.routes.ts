import { Router } from 'express'
import { z } from 'zod'
import { slugify } from '../../lib/codes.ts'
import { ApiError, asyncHandler, submittedFields } from '../../lib/http.ts'
import { adminEvent } from '../../lib/serialize.ts'
import { ACCENTS, BRANDS, Event } from '../../models/Event.ts'
import { Order } from '../../models/Order.ts'
import { Ticket } from '../../models/Ticket.ts'

const router = Router()

const ticketTypeSchema = z.object({
  name: z.string().min(1, 'Give this ticket tier a name').max(80),
  description: z.string().max(400).optional().default(''),
  price: z.number().min(0, 'Price cannot be negative'),
  quantity: z.number().int().min(0, 'Quantity cannot be negative'),
  perOrderLimit: z.number().int().min(1).max(50).optional().default(10),
  salesStart: z.coerce.date().nullable().optional(),
  salesEnd: z.coerce.date().nullable().optional(),
  isActive: z.boolean().optional().default(true),
})

const eventSchema = z.object({
  title: z.string().min(2, 'Give the event a title').max(160),
  slug: z.string().max(120).optional(),
  tagline: z.string().max(240).optional().default(''),
  description: z.string().max(8000).optional().default(''),
  brand: z.enum(BRANDS).optional().default('Luxury Music Sounds'),
  accent: z.enum(ACCENTS).optional().default('gold'),

  heroImage: z.string().max(500).optional().default(''),
  posterImage: z.string().max(500).optional().default(''),
  trailerVideo: z.string().max(500).optional().default(''),
  trailerPoster: z.string().max(500).optional().default(''),
  gallery: z.array(z.string().max(500)).max(40).optional().default([]),

  venue: z
    .object({
      name: z.string().max(160).optional().default(''),
      address: z.string().max(240).optional().default(''),
      city: z.string().max(120).optional().default(''),
      country: z.string().max(120).optional().default('Nigeria'),
    })
    .optional()
    .default({}),

  startsAt: z.coerce.date(),
  endsAt: z.coerce.date().nullable().optional(),
  doorsOpenAt: z.coerce.date().nullable().optional(),

  status: z.enum(['draft', 'published', 'archived']).optional().default('draft'),
  isHeadline: z.boolean().optional().default(false),
  showPopup: z.boolean().optional().default(true),
  sortOrder: z.number().int().optional().default(0),

  lineup: z
    .array(
      z.object({
        name: z.string().max(120).optional().default(''),
        role: z.string().max(120).optional().default(''),
        image: z.string().max(500).optional().default(''),
      }),
    )
    .max(30)
    .optional()
    .default([]),
  tags: z.array(z.string().max(40)).max(20).optional().default([]),
  ticketTypes: z.array(ticketTypeSchema).max(12).optional().default([]),
})

/** Makes sure a slug is unique, appending -2, -3 ... when it is not. */
async function uniqueSlug(base: string, ignoreId?: string): Promise<string> {
  const root = slugify(base) || 'event'
  let candidate = root

  for (let suffix = 2; suffix < 100; suffix += 1) {
    const clash = await Event.findOne({
      slug: candidate,
      ...(ignoreId ? { _id: { $ne: ignoreId } } : {}),
    })
    if (!clash) return candidate
    candidate = `${root}-${suffix}`
  }

  return `${root}-${Date.now().toString(36)}`
}

/** GET /api/admin/events */
router.get(
  '/',
  asyncHandler(async (req, res) => {
    const { status, brand, search, scope } = req.query as Record<string, string | undefined>

    const filter: Record<string, unknown> = {}
    if (status && status !== 'all') filter.status = status
    if (brand && brand !== 'all') filter.brand = brand
    if (scope === 'upcoming') filter.startsAt = { $gte: new Date() }
    if (scope === 'past') filter.startsAt = { $lt: new Date() }
    if (search) filter.title = { $regex: search.trim(), $options: 'i' }

    const events = await Event.find(filter).sort({ startsAt: -1 }).limit(200)
    res.json({ success: true, data: events.map(adminEvent) })
  }),
)

/** POST /api/admin/events */
router.post(
  '/',
  asyncHandler(async (req, res) => {
    const payload = eventSchema.parse(req.body)
    const slug = await uniqueSlug(payload.slug || payload.title)

    const event = await Event.create({ ...payload, slug })
    res.status(201).json({ success: true, data: adminEvent(event) })
  }),
)

/** GET /api/admin/events/:id */
router.get(
  '/:id',
  asyncHandler(async (req, res) => {
    const event = await Event.findById(req.params.id)
    if (!event) throw ApiError.notFound('That event no longer exists')

    res.json({ success: true, data: adminEvent(event) })
  }),
)

/** PATCH /api/admin/events/:id */
router.patch(
  '/:id',
  asyncHandler(async (req, res) => {
    const payload = submittedFields(req.body, eventSchema.partial().parse(req.body))

    const event = await Event.findById(req.params.id)
    if (!event) throw ApiError.notFound('That event no longer exists')

    if (payload.slug || payload.title) {
      const base = payload.slug || payload.title || event.title
      if (slugify(base) !== event.slug) {
        event.slug = await uniqueSlug(base, req.params.id)
      }
    }

    // Ticket tiers are edited through their own endpoints so live sales figures
    // can never be clobbered by a stale form submission.
    const { ticketTypes: _ignored, slug: _slug, ...rest } = payload
    Object.assign(event, rest)

    await event.save()
    res.json({ success: true, data: adminEvent(event) })
  }),
)

/** DELETE /api/admin/events/:id */
router.delete(
  '/:id',
  asyncHandler(async (req, res) => {
    const event = await Event.findById(req.params.id)
    if (!event) throw ApiError.notFound('That event no longer exists')

    const paidOrders = await Order.countDocuments({ event: event._id, status: 'paid' })
    if (paidOrders > 0) {
      throw ApiError.conflict(
        `This event has ${paidOrders} paid order(s). Archive it instead of deleting so the ticket records survive.`,
      )
    }

    await Order.deleteMany({ event: event._id })
    await Ticket.deleteMany({ event: event._id })
    await event.deleteOne()

    res.json({ success: true, message: 'Event deleted' })
  }),
)

/**
 * PATCH /api/admin/events/:id/headline
 * Only one event wears the headline badge at a time, so promoting one demotes
 * the rest in the same request.
 */
router.patch(
  '/:id/headline',
  asyncHandler(async (req, res) => {
    const makeHeadline = req.body?.isHeadline !== false

    const event = await Event.findById(req.params.id)
    if (!event) throw ApiError.notFound('That event no longer exists')

    if (makeHeadline) {
      await Event.updateMany({ _id: { $ne: event._id } }, { $set: { isHeadline: false } })
    }

    event.isHeadline = makeHeadline
    await event.save()

    res.json({ success: true, data: adminEvent(event) })
  }),
)

/** POST /api/admin/events/:id/ticket-types */
router.post(
  '/:id/ticket-types',
  asyncHandler(async (req, res) => {
    const payload = ticketTypeSchema.parse(req.body)

    const event = await Event.findById(req.params.id)
    if (!event) throw ApiError.notFound('That event no longer exists')

    event.ticketTypes.push(payload as never)
    await event.save()

    res.status(201).json({ success: true, data: adminEvent(event) })
  }),
)

/** PATCH /api/admin/events/:id/ticket-types/:typeId */
router.patch(
  '/:id/ticket-types/:typeId',
  asyncHandler(async (req, res) => {
    const payload = submittedFields(req.body, ticketTypeSchema.partial().parse(req.body))

    const event = await Event.findById(req.params.id)
    if (!event) throw ApiError.notFound('That event no longer exists')

    const type = event.ticketTypes.id(req.params.typeId)
    if (!type) throw ApiError.notFound('That ticket tier no longer exists')

    if (payload.quantity !== undefined && payload.quantity < type.sold) {
      throw ApiError.conflict(
        `${type.sold} of these are already sold, so the allocation cannot drop below ${type.sold}.`,
      )
    }

    Object.assign(type, payload)
    await event.save()

    res.json({ success: true, data: adminEvent(event) })
  }),
)

/** DELETE /api/admin/events/:id/ticket-types/:typeId */
router.delete(
  '/:id/ticket-types/:typeId',
  asyncHandler(async (req, res) => {
    const event = await Event.findById(req.params.id)
    if (!event) throw ApiError.notFound('That event no longer exists')

    const type = event.ticketTypes.id(req.params.typeId)
    if (!type) throw ApiError.notFound('That ticket tier no longer exists')

    if (type.sold > 0) {
      throw ApiError.conflict(
        'Tickets have already been sold at this tier. Switch it off instead of deleting it.',
      )
    }

    type.deleteOne()
    await event.save()

    res.json({ success: true, data: adminEvent(event) })
  }),
)

/** GET /api/admin/events/:id/orders */
router.get(
  '/:id/orders',
  asyncHandler(async (req, res) => {
    const { status } = req.query as Record<string, string | undefined>

    const filter: Record<string, unknown> = { event: req.params.id }
    if (status && status !== 'all') filter.status = status

    const orders = await Order.find(filter).sort({ createdAt: -1 }).limit(500)

    res.json({
      success: true,
      data: orders.map((order) => ({
        id: String(order._id),
        reference: order.reference,
        customer: order.customer,
        items: order.items,
        total: order.total,
        currency: order.currency,
        status: order.status,
        quantity: order.items.reduce((sum, item) => sum + item.quantity, 0),
        paidAt: order.paystack.paidAt,
        channel: order.paystack.channel,
        createdAt: (order as unknown as { createdAt: Date }).createdAt,
      })),
    })
  }),
)

/** GET /api/admin/events/:id/attendees */
router.get(
  '/:id/attendees',
  asyncHandler(async (req, res) => {
    const { status, search } = req.query as Record<string, string | undefined>

    const filter: Record<string, unknown> = { event: req.params.id }
    if (status && status !== 'all') filter.status = status
    if (search) {
      const pattern = { $regex: search.trim(), $options: 'i' }
      filter.$or = [{ code: pattern }, { 'attendee.name': pattern }, { 'attendee.email': pattern }]
    }

    const tickets = await Ticket.find(filter).sort({ createdAt: -1 }).limit(1000)

    res.json({
      success: true,
      data: tickets.map((ticket) => ({
        id: String(ticket._id),
        code: ticket.code,
        orderReference: ticket.orderReference,
        ticketType: ticket.ticketTypeName,
        price: ticket.price,
        attendee: ticket.attendee,
        status: ticket.status,
        checkedInAt: ticket.checkedInAt,
        checkedInBy: ticket.checkedInBy,
      })),
    })
  }),
)

export default router
