import type { NextFunction, Request, RequestHandler, Response } from 'express'

export class ApiError extends Error {
  status: number
  details?: unknown

  constructor(status: number, message: string, details?: unknown) {
    super(message)
    this.name = 'ApiError'
    this.status = status
    this.details = details
  }

  static badRequest(message = 'Bad request', details?: unknown) {
    return new ApiError(400, message, details)
  }
  static unauthorized(message = 'Not authenticated') {
    return new ApiError(401, message)
  }
  static forbidden(message = 'Not allowed') {
    return new ApiError(403, message)
  }
  static notFound(message = 'Not found') {
    return new ApiError(404, message)
  }
  static conflict(message = 'Conflict', details?: unknown) {
    return new ApiError(409, message, details)
  }
  static unprocessable(message = 'Unprocessable', details?: unknown) {
    return new ApiError(422, message, details)
  }
}

/**
 * Narrows a parsed payload to the keys the caller actually sent.
 *
 * `schema.partial()` makes every field optional, but a field declared with
 * `.default(x)` still yields `x` when its key is absent. That turns a two-field
 * PATCH into a full overwrite: send `{ trailerVideo }` and `status` silently
 * reverts to 'draft', unpublishing a live event.
 *
 * Intersecting with the raw request body means a PATCH can only ever touch
 * fields that were genuinely submitted, whatever the schema's defaults say.
 */
export function submittedFields<T extends Record<string, unknown>>(
  body: unknown,
  parsed: T,
): Partial<T> {
  const sent = new Set(Object.keys((body ?? {}) as Record<string, unknown>))

  return Object.fromEntries(
    Object.entries(parsed).filter(([key]) => sent.has(key)),
  ) as Partial<T>
}

/** Wraps an async handler so rejected promises reach the error middleware. */
export function asyncHandler(
  handler: (req: Request, res: Response, next: NextFunction) => Promise<unknown>,
): RequestHandler {
  return (req, res, next) => {
    handler(req, res, next).catch(next)
  }
}
