import { Router } from 'express'
import { asyncHandler } from '../lib/http.ts'
import { getSettings } from '../models/Settings.ts'
import { publicSettings } from '../lib/serialize.ts'

const router = Router()

/** GET /api/settings: the editable chrome the public site needs. */
router.get(
  '/',
  asyncHandler(async (_req, res) => {
    const settings = await getSettings()
    res.json({ success: true, data: publicSettings(settings) })
  }),
)

export default router
