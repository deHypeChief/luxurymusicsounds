import type { NextFunction, Request, Response } from 'express'
import jwt from 'jsonwebtoken'
import { env } from '../config/env.ts'
import { ApiError, asyncHandler } from '../lib/http.ts'
import { Admin, type IAdmin } from '../models/Admin.ts'

export interface AuthedRequest extends Request {
  admin?: IAdmin
}

interface TokenPayload {
  sub: string
  role: 'owner' | 'admin'
}

export function signAuthToken(admin: IAdmin): string {
  return jwt.sign({ sub: String(admin._id), role: admin.role }, env.jwtSecret, {
    expiresIn: env.jwtExpiresIn,
  } as jwt.SignOptions)
}

export function setAuthCookie(res: Response, token: string): void {
  res.cookie(env.cookieName, token, {
    httpOnly: true,
    secure: env.isProd,
    // Cross-site in production (api.* and www.* are different origins), lax locally.
    sameSite: env.isProd ? 'none' : 'lax',
    domain: env.cookieDomain || undefined,
    path: '/',
    maxAge: 7 * 24 * 60 * 60 * 1000,
  })
}

export function clearAuthCookie(res: Response): void {
  res.clearCookie(env.cookieName, {
    httpOnly: true,
    secure: env.isProd,
    sameSite: env.isProd ? 'none' : 'lax',
    domain: env.cookieDomain || undefined,
    path: '/',
  })
}

function readToken(req: Request): string | null {
  const cookieToken = (req as Request & { cookies?: Record<string, string> }).cookies?.[env.cookieName]
  if (cookieToken) return cookieToken

  const header = req.headers.authorization
  if (header?.startsWith('Bearer ')) return header.slice(7)

  return null
}

export const requireAdmin = asyncHandler(async (req: AuthedRequest, _res, next: NextFunction) => {
  const token = readToken(req)
  if (!token) throw ApiError.unauthorized('Sign in to continue')

  let payload: TokenPayload
  try {
    payload = jwt.verify(token, env.jwtSecret) as TokenPayload
  } catch {
    throw ApiError.unauthorized('Your session has expired. Please sign in again.')
  }

  const admin = await Admin.findById(payload.sub)
  if (!admin) throw ApiError.unauthorized('This account no longer exists')

  req.admin = admin
  next()
})

/** Restricts an action to the owner account (e.g. managing other admins). */
export function requireOwner(req: AuthedRequest, _res: Response, next: NextFunction): void {
  if (req.admin?.role !== 'owner') {
    next(ApiError.forbidden('Only the owner account can do that'))
    return
  }
  next()
}
