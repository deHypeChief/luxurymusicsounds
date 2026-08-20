import { Router } from 'express'
import { cloudflareEnabled, env, paystackEnabled } from '../../config/env.ts'
import { createDirectUploadUrl, deleteImage } from '../../lib/cloudflare.ts'
import { asyncHandler } from '../../lib/http.ts'
import { publicEvent } from '../../lib/serialize.ts'
import { requireAdmin } from '../../middleware/auth.ts'
import { Event } from '../../models/Event.ts'
import { GalleryItem } from '../../models/GalleryItem.ts'
import { Order } from '../../models/Order.ts'
import { Ticket } from '../../models/Ticket.ts'
import eventsRouter from './events.routes.ts'
import galleryRouter from './gallery.routes.ts'
import settingsRouter from './settings.routes.ts'
import ticketsRouter from './tickets.routes.ts'

const router = Router()

// Everything below this line requires a signed-in admin.
router.use(requireAdmin)

/** GET /api/admin/stats: the dashboard summary. */
router.get(
  '/stats',
  asyncHandler(async (_req, res) => {
    const now = new Date()

    const [
      publishedEvents,
      draftEvents,
      upcomingEvents,
      galleryCount,
      ticketsIssued,
      ticketsCheckedIn,
      revenue,
      recentOrders,
      nextEvent,
    ] = await Promise.all([
      Event.countDocuments({ status: 'published' }),
      Event.countDocuments({ status: 'draft' }),
      Event.countDocuments({ status: 'published', startsAt: { $gte: now } }),
      GalleryItem.countDocuments({}),
      Ticket.countDocuments({}),
      Ticket.countDocuments({ status: 'used' }),
      Order.aggregate<{ _id: null; total: number; orders: number }>([
        { $match: { status: 'paid' } },
        { $group: { _id: null, total: { $sum: '$total' }, orders: { $sum: 1 } } },
      ]),
      Order.find({ status: 'paid' }).sort({ createdAt: -1 }).limit(8),
      Event.findOne({ status: 'published', startsAt: { $gte: now } }).sort({ startsAt: 1 }),
    ])

    res.json({
      success: true,
      data: {
        events: { published: publishedEvents, draft: draftEvents, upcoming: upcomingEvents },
        gallery: { total: galleryCount },
        tickets: { issued: ticketsIssued, checkedIn: ticketsCheckedIn },
        revenue: {
          gross: revenue[0]?.total ?? 0,
          orders: revenue[0]?.orders ?? 0,
          currency: env.paystack.currency,
        },
        integrations: { paystack: paystackEnabled, cloudflareImages: cloudflareEnabled },
        nextEvent: nextEvent ? publicEvent(nextEvent) : null,
        recentOrders: recentOrders.map((order) => ({
          id: String(order._id),
          reference: order.reference,
          eventTitle: order.eventTitle,
          customer: order.customer.name,
          total: order.total,
          currency: order.currency,
          quantity: order.items.reduce((sum, item) => sum + item.quantity, 0),
          createdAt: (order as unknown as { createdAt: Date }).createdAt,
        })),
      },
    })
  }),
)

/**
 * POST /api/admin/uploads/direct-upload
 * Returns a one-shot Cloudflare Images URL. The browser uploads straight to
 * Cloudflare, so large files never travel through this server.
 */
router.post(
  '/uploads/direct-upload',
  asyncHandler(async (req, res) => {
    const metadata: Record<string, string> = {}
    if (typeof req.body?.context === 'string') metadata.context = req.body.context.slice(0, 120)

    const ticket = await createDirectUploadUrl(metadata)

    res.json({
      success: true,
      data: {
        ...ticket,
        accountHash: env.cloudflare.accountHash,
        variant: env.cloudflare.defaultVariant,
      },
    })
  }),
)

/** DELETE /api/admin/uploads/:imageId */
router.delete(
  '/uploads/:imageId',
  asyncHandler(async (req, res) => {
    await deleteImage(req.params.imageId)
    res.json({ success: true, message: 'Image deleted' })
  }),
)

/** GET /api/admin/orders: every order across all events. */
router.get(
  '/orders',
  asyncHandler(async (req, res) => {
    const { status, search } = req.query as Record<string, string | undefined>

    const filter: Record<string, unknown> = {}
    if (status && status !== 'all') filter.status = status
    if (search) {
      const pattern = { $regex: search.trim(), $options: 'i' }
      filter.$or = [
        { reference: pattern },
        { eventTitle: pattern },
        { 'customer.name': pattern },
        { 'customer.email': pattern },
      ]
    }

    const orders = await Order.find(filter).sort({ createdAt: -1 }).limit(300)

    res.json({
      success: true,
      data: orders.map((order) => ({
        id: String(order._id),
        reference: order.reference,
        eventTitle: order.eventTitle,
        eventStartsAt: order.eventStartsAt,
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

router.use('/events', eventsRouter)
router.use('/gallery', galleryRouter)
router.use('/settings', settingsRouter)
router.use('/tickets', ticketsRouter)

export default router
