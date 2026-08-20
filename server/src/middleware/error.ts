import type { NextFunction, Request, Response } from 'express'
import mongoose from 'mongoose'
import { ZodError } from 'zod'
import { env } from '../config/env.ts'
import { ApiError } from '../lib/http.ts'

export function notFoundHandler(req: Request, _res: Response, next: NextFunction): void {
  next(ApiError.notFound(`No route matches ${req.method} ${req.originalUrl}`))
}

export function errorHandler(
  error: unknown,
  _req: Request,
  res: Response,
  _next: NextFunction,
): void {
  let status = 500
  let message = 'Something went wrong on our end'
  let details: unknown

  if (error instanceof ApiError) {
    status = error.status
    message = error.message
    details = error.details
  } else if (error instanceof ZodError) {
    status = 422
    message = 'Please check the highlighted fields'
    details = error.issues.map((issue) => ({
      field: issue.path.join('.'),
      message: issue.message,
    }))
  } else if (error instanceof mongoose.Error.ValidationError) {
    status = 422
    message = 'Please check the highlighted fields'
    details = Object.values(error.errors).map((issue) => ({
      field: issue.path,
      message: issue.message,
    }))
  } else if (error instanceof mongoose.Error.CastError) {
    status = 400
    message = `"${error.value}" is not a valid ${error.path}`
  } else if (
    typeof error === 'object' &&
    error !== null &&
    (error as { code?: number }).code === 11000
  ) {
    status = 409
    const field = Object.keys((error as { keyValue?: Record<string, unknown> }).keyValue ?? {})[0]
    message = field ? `That ${field} is already taken` : 'That record already exists'
  } else if (error instanceof Error) {
    message = env.isProd ? message : error.message
  }

  if (status >= 500) {
    console.error('[error]', error)
  }

  res.status(status).json({
    success: false,
    message,
    ...(details ? { details } : {}),
  })
}
