import { cloudflareEnabled, env } from '../config/env.ts'
import { ApiError } from './http.ts'

export interface DirectUploadTicket {
  uploadUrl: string
  imageId: string
}

const API_BASE = 'https://api.cloudflare.com/client/v4'

/**
 * Mints a one-time Cloudflare Images upload URL. The browser POSTs the file
 * straight to Cloudflare, so image bytes never pass through this server and the
 * API token stays server-side.
 */
export async function createDirectUploadUrl(
  metadata: Record<string, string> = {},
): Promise<DirectUploadTicket> {
  if (!cloudflareEnabled) {
    throw new ApiError(
      503,
      'Cloudflare Images is not configured. Set CLOUDFLARE_ACCOUNT_ID and CLOUDFLARE_IMAGES_TOKEN.',
    )
  }

  const form = new FormData()
  form.append('requireSignedURLs', 'false')
  form.append('metadata', JSON.stringify(metadata))
  // 30 minutes is plenty for an admin picking a file, and keeps the URL short-lived.
  form.append('expiry', new Date(Date.now() + 30 * 60 * 1000).toISOString())

  const response = await fetch(
    `${API_BASE}/accounts/${env.cloudflare.accountId}/images/v2/direct_upload`,
    {
      method: 'POST',
      headers: { Authorization: `Bearer ${env.cloudflare.apiToken}` },
      body: form,
    },
  )

  const payload = (await response.json().catch(() => null)) as any

  if (!response.ok || !payload?.success) {
    throw new ApiError(
      502,
      payload?.errors?.[0]?.message ?? 'Could not create a Cloudflare upload URL',
    )
  }

  return { uploadUrl: payload.result.uploadURL, imageId: payload.result.id }
}

export async function deleteImage(imageId: string): Promise<void> {
  if (!cloudflareEnabled || !imageId) return

  await fetch(
    `${API_BASE}/accounts/${env.cloudflare.accountId}/images/v1/${encodeURIComponent(imageId)}`,
    {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${env.cloudflare.apiToken}` },
    },
  ).catch(() => undefined)
}

/**
 * Builds a delivery URL for a stored Cloudflare image id.
 *
 * Two kinds of value pass straight through untouched: absolute URLs, and
 * site-relative paths like `/media/photo.jpg` for assets shipped with the front
 * end. Without that second case, configuring Cloudflare would silently rewrite
 * those paths into broken imagedelivery.net URLs.
 */
export function imageUrl(idOrUrl: string, variant = env.cloudflare.defaultVariant): string {
  if (!idOrUrl) return ''
  if (idOrUrl.startsWith('http://') || idOrUrl.startsWith('https://')) return idOrUrl
  if (idOrUrl.startsWith('/')) return idOrUrl
  if (!env.cloudflare.accountHash) return idOrUrl
  return `https://imagedelivery.net/${env.cloudflare.accountHash}/${idOrUrl}/${variant}`
}
