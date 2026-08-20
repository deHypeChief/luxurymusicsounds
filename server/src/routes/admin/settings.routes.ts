import { Router } from 'express'
import { z } from 'zod'
import { asyncHandler, submittedFields } from '../../lib/http.ts'
import { publicSettings } from '../../lib/serialize.ts'
import { BRANDS } from '../../models/Event.ts'
import { getSettings } from '../../models/Settings.ts'

const router = Router()

const settingsSchema = z.object({
  contact: z
    .object({
      email: z.string().max(160).optional().default(''),
      phone: z.string().max(60).optional().default(''),
      city: z.string().max(120).optional().default(''),
    })
    .optional(),
  footerHeading: z.string().max(80).optional(),
  footerIntro: z.string().max(600).optional(),
  socials: z
    .array(
      z.object({
        brand: z.enum(BRANDS),
        platform: z.string().min(1, 'Name the platform').max(40),
        handle: z.string().max(80).optional().default(''),
        url: z.string().url('Enter a full URL, starting with https://').max(400),
        sortOrder: z.number().int().optional().default(0),
      }),
    )
    .max(40)
    .optional(),
})

/** GET /api/admin/settings */
router.get(
  '/',
  asyncHandler(async (_req, res) => {
    const settings = await getSettings()
    res.json({ success: true, data: publicSettings(settings) })
  }),
)

/** PATCH /api/admin/settings */
router.patch(
  '/',
  asyncHandler(async (req, res) => {
    const payload = submittedFields(req.body, settingsSchema.parse(req.body))

    const settings = await getSettings()
    Object.assign(settings, payload)
    await settings.save()

    res.json({ success: true, data: publicSettings(settings) })
  }),
)

export default router
