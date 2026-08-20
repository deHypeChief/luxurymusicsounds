import { Router } from 'express'
import { ApiError, asyncHandler } from '../lib/http.ts'
import { publicEvent } from '../lib/serialize.ts'
import { Event } from '../models/Event.ts'

const router = Router()

/** GET /api/events: published events, upcoming first. */
router.get(
  '/',
  asyncHandler(async (req, res) => {
    const { brand, scope = 'upcoming', limit } = req.query as Record<string, string | undefined>

    const filter: Record<string, unknown> = { status: 'published' }
    if (brand) filter.brand = brand
    if (scope === 'upcoming') filter.startsAt = { $gte: new Date() }
    if (scope === 'past') filter.startsAt = { $lt: new Date() }

    const query = Event.find(filter).sort(
      scope === 'past' ? { startsAt: -1 } : { sortOrder: -1, startsAt: 1 },
    )
    if (limit) query.limit(Math.min(Number(limit) || 12, 60))

    const events = await query.exec()
    res.json({ success: true, data: events.map(publicEvent) })
  }),
)

/**
 * GET /api/events/headline: the current special event for the home page hero
 * and the buy-tickets dialog. Falls back to the soonest published event so the
 * section is never empty.
 */
router.get(
  '/headline',
  asyncHandler(async (_req, res) => {
    const now = new Date()
    const base = { status: 'published', startsAt: { $gte: now } }

    const headline =
      (await Event.findOne({ ...base, isHeadline: true }).sort({ sortOrder: -1, startsAt: 1 })) ??
      (await Event.findOne(base).sort({ sortOrder: -1, startsAt: 1 }))

    res.json({ success: true, data: headline ? publicEvent(headline) : null })
  }),
)

/** GET /api/events/:slug */
router.get(
  '/:slug',
  asyncHandler(async (req, res) => {
    const event = await Event.findOne({ slug: req.params.slug.toLowerCase(), status: 'published' })
    if (!event) throw ApiError.notFound('We could not find that event')

    res.json({ success: true, data: publicEvent(event) })
  }),
)

export default router
