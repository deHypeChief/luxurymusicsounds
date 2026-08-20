import { Router } from 'express'
import { z } from 'zod'
import { ApiError, asyncHandler } from '../lib/http.ts'
import {
  clearAuthCookie,
  requireAdmin,
  setAuthCookie,
  signAuthToken,
  type AuthedRequest,
} from '../middleware/auth.ts'
import { Admin } from '../models/Admin.ts'

const router = Router()

const loginSchema = z.object({
  email: z.string().email('Enter a valid email address'),
  password: z.string().min(1, 'Enter your password'),
})

router.post(
  '/login',
  asyncHandler(async (req, res) => {
    const { email, password } = loginSchema.parse(req.body)

    const admin = await Admin.findOne({ email: email.toLowerCase() }).select('+passwordHash')
    // Same message either way so the form can't be used to enumerate accounts.
    if (!admin || !(await admin.comparePassword(password))) {
      throw ApiError.unauthorized('Those details do not match an account')
    }

    admin.lastLoginAt = new Date()
    await admin.save()

    setAuthCookie(res, signAuthToken(admin))

    res.json({
      success: true,
      data: { id: String(admin._id), name: admin.name, email: admin.email, role: admin.role },
    })
  }),
)

router.post('/logout', (_req, res) => {
  clearAuthCookie(res)
  res.json({ success: true, message: 'Signed out' })
})

router.get(
  '/me',
  requireAdmin,
  asyncHandler(async (req: AuthedRequest, res) => {
    const admin = req.admin!
    res.json({
      success: true,
      data: {
        id: String(admin._id),
        name: admin.name,
        email: admin.email,
        role: admin.role,
        lastLoginAt: admin.lastLoginAt,
      },
    })
  }),
)

export default router
