import crypto from 'node:crypto'
import { env, paystackEnabled } from '../config/env.ts'
import { ApiError } from './http.ts'

export interface PaystackInitializeInput {
  email: string
  /** Amount in the major unit (naira). Converted to kobo before sending. */
  amount: number
  reference: string
  callbackUrl: string
  metadata?: Record<string, unknown>
}

export interface PaystackInitializeResult {
  authorizationUrl: string
  accessCode: string
  reference: string
}

export interface PaystackVerifyResult {
  status: string
  reference: string
  /** Amount in the major unit (naira), converted back from kobo. */
  amount: number
  currency: string
  paidAt: string | null
  channel: string | null
  raw: Record<string, unknown>
}

async function paystackRequest<T>(
  path: string,
  init: RequestInit = {},
): Promise<T> {
  if (!paystackEnabled) {
    throw new ApiError(
      503,
      'Payments are not configured. Set PAYSTACK_SECRET_KEY on the server.',
    )
  }

  const response = await fetch(`${env.paystack.baseUrl}${path}`, {
    ...init,
    headers: {
      Authorization: `Bearer ${env.paystack.secretKey}`,
      'Content-Type': 'application/json',
      ...(init.headers ?? {}),
    },
  })

  const payload = (await response.json().catch(() => null)) as
    | { status?: boolean; message?: string; data?: T }
    | null

  if (!response.ok || !payload?.status) {
    throw new ApiError(
      response.status === 401 ? 500 : 502,
      payload?.message ?? 'Paystack request failed',
    )
  }

  return payload.data as T
}

export async function initializeTransaction(
  input: PaystackInitializeInput,
): Promise<PaystackInitializeResult> {
  const data = await paystackRequest<{
    authorization_url: string
    access_code: string
    reference: string
  }>('/transaction/initialize', {
    method: 'POST',
    body: JSON.stringify({
      email: input.email,
      amount: Math.round(input.amount * 100),
      reference: input.reference,
      currency: env.paystack.currency,
      callback_url: input.callbackUrl,
      metadata: input.metadata ?? {},
    }),
  })

  return {
    authorizationUrl: data.authorization_url,
    accessCode: data.access_code,
    reference: data.reference,
  }
}

export async function verifyTransaction(
  reference: string,
): Promise<PaystackVerifyResult> {
  const data = await paystackRequest<Record<string, any>>(
    `/transaction/verify/${encodeURIComponent(reference)}`,
  )

  return {
    status: String(data.status ?? 'unknown'),
    reference: String(data.reference ?? reference),
    amount: Number(data.amount ?? 0) / 100,
    currency: String(data.currency ?? env.paystack.currency),
    paidAt: (data.paid_at as string | null) ?? null,
    channel: (data.channel as string | null) ?? null,
    raw: data,
  }
}

/**
 * Paystack signs webhooks with HMAC SHA512 over the *raw* request body.
 * Comparison is timing-safe to avoid leaking the signature byte by byte.
 */
export function verifyWebhookSignature(
  rawBody: Buffer | string,
  signature: string | undefined,
): boolean {
  if (!signature || !env.paystack.secretKey) return false

  const expected = crypto
    .createHmac('sha512', env.paystack.secretKey)
    .update(rawBody)
    .digest('hex')

  const a = Buffer.from(expected, 'utf8')
  const b = Buffer.from(signature, 'utf8')
  if (a.length !== b.length) return false

  return crypto.timingSafeEqual(a, b)
}
