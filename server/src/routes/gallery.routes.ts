import { Router } from 'express'
import { asyncHandler } from '../lib/http.ts'
import { publicGalleryItem } from '../lib/serialize.ts'
import { GalleryItem } from '../models/GalleryItem.ts'

const router = Router()

/** GET /api/gallery: published gallery tiles, optionally filtered. */
router.get(
  '/',
  asyncHandler(async (req, res) => {
    const { brand, category, featured, mediaType, limit } = req.query as Record<
      string,
      string | undefined
    >

    const filter: Record<string, unknown> = { isPublished: true }
    if (mediaType === 'image' || mediaType === 'video') filter.mediaType = mediaType
    if (brand && brand !== 'all') filter.brand = brand
    if (category && category !== 'all') filter.category = category
    if (featured === 'true') filter.featured = true

    const query = GalleryItem.find(filter).sort({ sortOrder: -1, createdAt: -1 })
    if (limit) query.limit(Math.min(Number(limit) || 24, 120))

    const items = await query.exec()

    res.json({
      success: true,
      data: {
        items: items.map(publicGalleryItem),
        categories: [...new Set(items.map((item) => item.category))].filter(Boolean),
      },
    })
  }),
)

export default router
