import { Router } from 'express'
import { z } from 'zod'
import { deleteImage } from '../../lib/cloudflare.ts'
import { ApiError, asyncHandler, submittedFields } from '../../lib/http.ts'
import { adminGalleryItem } from '../../lib/serialize.ts'
import { BRANDS } from '../../models/Event.ts'
import { GalleryItem } from '../../models/GalleryItem.ts'

const router = Router()

const gallerySchema = z.object({
  title: z.string().max(160).optional().default(''),
  caption: z.string().max(400).optional().default(''),
  mediaType: z.enum(['image', 'video']).optional().default('image'),
  image: z.string().min(1, 'Add a file first').max(500),
  poster: z.string().max(500).optional().default(''),
  brand: z.enum(BRANDS).optional().default('Luxury Music Sounds'),
  category: z.string().max(80).optional().default('Performances'),
  orientation: z.enum(['portrait', 'landscape', 'square']).optional().default('landscape'),
  featured: z.boolean().optional().default(false),
  sortOrder: z.number().int().optional().default(0),
  event: z.string().nullable().optional(),
  isPublished: z.boolean().optional().default(true),
})

/** GET /api/admin/gallery */
router.get(
  '/',
  asyncHandler(async (req, res) => {
    const { brand, category, published } = req.query as Record<string, string | undefined>

    const filter: Record<string, unknown> = {}
    if (brand && brand !== 'all') filter.brand = brand
    if (category && category !== 'all') filter.category = category
    if (published === 'true') filter.isPublished = true
    if (published === 'false') filter.isPublished = false

    const items = await GalleryItem.find(filter).sort({ sortOrder: -1, createdAt: -1 }).limit(500)
    res.json({ success: true, data: items.map(adminGalleryItem) })
  }),
)

/** POST /api/admin/gallery: accepts one item or a batch from a multi-file upload. */
router.post(
  '/',
  asyncHandler(async (req, res) => {
    const body = Array.isArray(req.body) ? req.body : [req.body]
    const payloads = body.map((item) => gallerySchema.parse(item))

    const created = await GalleryItem.insertMany(payloads)
    res.status(201).json({ success: true, data: created.map(adminGalleryItem) })
  }),
)

/** PATCH /api/admin/gallery/:id */
router.patch(
  '/:id',
  asyncHandler(async (req, res) => {
    const payload = submittedFields(req.body, gallerySchema.partial().parse(req.body))

    const item = await GalleryItem.findByIdAndUpdate(req.params.id, payload, {
      new: true,
      runValidators: true,
    })
    if (!item) throw ApiError.notFound('That image is no longer in the gallery')

    res.json({ success: true, data: adminGalleryItem(item) })
  }),
)

/** PATCH /api/admin/gallery/reorder: persists a drag-and-drop arrangement. */
router.patch(
  '/order/bulk',
  asyncHandler(async (req, res) => {
    const payload = z
      .array(z.object({ id: z.string(), sortOrder: z.number().int() }))
      .max(500)
      .parse(req.body?.items ?? req.body)

    await GalleryItem.bulkWrite(
      payload.map((entry) => ({
        updateOne: {
          filter: { _id: entry.id },
          update: { $set: { sortOrder: entry.sortOrder } },
        },
      })),
    )

    res.json({ success: true, message: 'Order saved' })
  }),
)

/** DELETE /api/admin/gallery/:id: also removes the file from Cloudflare Images. */
router.delete(
  '/:id',
  asyncHandler(async (req, res) => {
    const item = await GalleryItem.findByIdAndDelete(req.params.id)
    if (!item) throw ApiError.notFound('That image is no longer in the gallery')

    await deleteImage(item.image)

    res.json({ success: true, message: 'Image removed' })
  }),
)

export default router
