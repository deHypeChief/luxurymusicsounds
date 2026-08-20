/**
 * Thin wrapper around fetch for the Luxury Music Sounds API.
 *
 * Every response is unwrapped to its `data` payload, and every failure becomes
 * an ApiError carrying the server's own message, so screens can show what the
 * API actually said instead of inventing their own copy.
 */

const BASE_URL = import.meta.env.VITE_API_URL ?? '/api'

export class ApiError extends Error {
  constructor(message, { status, details, data } = {}) {
    super(message)
    this.name = 'ApiError'
    this.status = status
    this.details = details
    // Some failures still carry a useful record, a 409 check-in returns the
    // ticket that was already used, which the door screen wants to display.
    this.data = data
  }

  /** Maps `details` into { fieldName: message } for inline form errors. */
  get fieldErrors() {
    if (!Array.isArray(this.details)) return {}
    return Object.fromEntries(this.details.map((issue) => [issue.field, issue.message]))
  }
}

async function request(path, { method = 'GET', body, signal, headers } = {}) {
  let response

  try {
    response = await fetch(`${BASE_URL}${path}`, {
      method,
      credentials: 'include',
      signal,
      headers: {
        ...(body === undefined ? {} : { 'Content-Type': 'application/json' }),
        ...headers,
      },
      body: body === undefined ? undefined : JSON.stringify(body),
    })
  } catch (error) {
    if (error.name === 'AbortError') throw error
    throw new ApiError('We could not reach the server. Check your connection and try again.')
  }

  const payload = await response.json().catch(() => null)

  if (!response.ok || payload?.success === false) {
    throw new ApiError(payload?.message ?? 'Something went wrong. Please try again.', {
      status: response.status,
      details: payload?.details,
      data: payload?.data,
    })
  }

  return payload?.data ?? payload
}

export const api = {
  get: (path, options) => request(path, { ...options, method: 'GET' }),
  post: (path, body, options) => request(path, { ...options, method: 'POST', body }),
  patch: (path, body, options) => request(path, { ...options, method: 'PATCH', body }),
  delete: (path, options) => request(path, { ...options, method: 'DELETE' }),
}

/* --- Public endpoints ----------------------------------------------------- */

export const publicApi = {
  events: (params = {}) => api.get(`/events${toQuery(params)}`),
  headlineEvent: () => api.get('/events/headline'),
  event: (slug) => api.get(`/events/${slug}`),
  gallery: (params = {}) => api.get(`/gallery${toQuery(params)}`),
  settings: () => api.get('/settings'),
  startCheckout: (payload) => api.post('/checkout/initialize', payload),
  verifyCheckout: (reference) => api.get(`/checkout/verify/${reference}`),
}

/* --- Admin endpoints ------------------------------------------------------ */

export const adminApi = {
  login: (email, password) => api.post('/auth/login', { email, password }),
  logout: () => api.post('/auth/logout'),
  me: () => api.get('/auth/me'),

  stats: () => api.get('/admin/stats'),
  orders: (params = {}) => api.get(`/admin/orders${toQuery(params)}`),

  events: (params = {}) => api.get(`/admin/events${toQuery(params)}`),
  event: (id) => api.get(`/admin/events/${id}`),
  createEvent: (payload) => api.post('/admin/events', payload),
  updateEvent: (id, payload) => api.patch(`/admin/events/${id}`, payload),
  deleteEvent: (id) => api.delete(`/admin/events/${id}`),
  setHeadline: (id, isHeadline) => api.patch(`/admin/events/${id}/headline`, { isHeadline }),

  addTicketType: (eventId, payload) => api.post(`/admin/events/${eventId}/ticket-types`, payload),
  updateTicketType: (eventId, typeId, payload) =>
    api.patch(`/admin/events/${eventId}/ticket-types/${typeId}`, payload),
  deleteTicketType: (eventId, typeId) =>
    api.delete(`/admin/events/${eventId}/ticket-types/${typeId}`),

  eventOrders: (eventId, params = {}) => api.get(`/admin/events/${eventId}/orders${toQuery(params)}`),
  eventAttendees: (eventId, params = {}) =>
    api.get(`/admin/events/${eventId}/attendees${toQuery(params)}`),

  lookupTicket: (code) => api.get(`/admin/tickets/${code}`),
  checkIn: (code) => api.post(`/admin/tickets/${code}/check-in`),
  undoCheckIn: (code) => api.post(`/admin/tickets/${code}/undo-check-in`),
  voidTicket: (code) => api.post(`/admin/tickets/${code}/void`),

  gallery: (params = {}) => api.get(`/admin/gallery${toQuery(params)}`),
  createGalleryItems: (payload) => api.post('/admin/gallery', payload),
  updateGalleryItem: (id, payload) => api.patch(`/admin/gallery/${id}`, payload),
  deleteGalleryItem: (id) => api.delete(`/admin/gallery/${id}`),
  reorderGallery: (items) => api.patch('/admin/gallery/order/bulk', { items }),

  settings: () => api.get('/admin/settings'),
  updateSettings: (payload) => api.patch('/admin/settings', payload),

  directUpload: (context) => api.post('/admin/uploads/direct-upload', { context }),
}

function toQuery(params) {
  const search = new URLSearchParams()
  for (const [key, value] of Object.entries(params)) {
    if (value === undefined || value === null || value === '') continue
    search.set(key, String(value))
  }
  const query = search.toString()
  return query ? `?${query}` : ''
}

/**
 * Uploads a file straight to Cloudflare Images using a one-shot URL minted by
 * our API. The bytes never touch our server, and the API token stays server
 * side. Returns the Cloudflare image id to store on the record.
 */
export async function uploadImage(file, context = '') {
  const ticket = await adminApi.directUpload(context)

  const form = new FormData()
  form.append('file', file)

  const response = await fetch(ticket.uploadUrl, { method: 'POST', body: form })
  const payload = await response.json().catch(() => null)

  if (!response.ok || !payload?.success) {
    throw new ApiError(payload?.errors?.[0]?.message ?? 'Cloudflare rejected that upload')
  }

  return {
    imageId: payload.result.id,
    url: ticket.accountHash
      ? `https://imagedelivery.net/${ticket.accountHash}/${payload.result.id}/${ticket.variant}`
      : '',
  }
}

/**
 * Site settings are needed by the footer on every page, so the in-flight
 * request is shared and the result cached for the session. Without this, every
 * client-side navigation would refetch the same unchanging record.
 */
let settingsPromise = null

export function loadSiteSettings() {
  if (!settingsPromise) {
    settingsPromise = publicApi.settings().catch((error) => {
      // Let the next caller retry rather than caching a failure forever.
      settingsPromise = null
      throw error
    })
  }
  return settingsPromise
}

/** Called after an admin save so the public site picks the change up. */
export function clearSiteSettingsCache() {
  settingsPromise = null
}
