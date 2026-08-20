const money = new Intl.NumberFormat('en-NG', {
  style: 'currency',
  currency: 'NGN',
  maximumFractionDigits: 0,
})

/**
 * Money as a plain amount. Use for totals, revenue and any figure in a column
 * of numbers, where a zero means "nothing yet" rather than "no charge".
 */
export function formatMoney(amount, currency = 'NGN') {
  if (amount === null || amount === undefined) return '-'
  if (currency !== 'NGN') {
    return new Intl.NumberFormat('en-NG', {
      style: 'currency',
      currency,
      maximumFractionDigits: 0,
    }).format(amount)
  }
  return money.format(amount)
}

/**
 * Money as a price to a customer, where zero genuinely means free entry.
 * Never use for revenue: "Gross revenue: Free" is not a sentence.
 */
export function formatPrice(amount, currency = 'NGN') {
  if (amount === null || amount === undefined) return '-'
  if (amount === 0) return 'Free'
  return formatMoney(amount, currency)
}

export function formatDate(value, options = {}) {
  if (!value) return ''
  return new Date(value).toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    ...options,
  })
}

export function formatTime(value) {
  if (!value) return ''
  return new Date(value)
    .toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit', hour12: true })
    .toUpperCase()
}

/** "Fri 21 Nov", the compact form used on cards and listings. */
export function formatShortDate(value) {
  if (!value) return ''
  return new Date(value).toLocaleDateString('en-GB', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
  })
}

export function formatDateParts(value) {
  if (!value) return { day: '', month: '', weekday: '', year: '' }
  const date = new Date(value)
  return {
    day: date.toLocaleDateString('en-GB', { day: '2-digit' }),
    month: date.toLocaleDateString('en-GB', { month: 'short' }).toUpperCase(),
    weekday: date.toLocaleDateString('en-GB', { weekday: 'long' }),
    year: String(date.getFullYear()),
  }
}

/** Splits the gap to an event into units a countdown can render. */
export function countdownParts(target) {
  const total = new Date(target).getTime() - Date.now()
  if (total <= 0) return null

  return {
    days: Math.floor(total / 86_400_000),
    hours: Math.floor((total / 3_600_000) % 24),
    minutes: Math.floor((total / 60_000) % 60),
    seconds: Math.floor((total / 1000) % 60),
  }
}

/** For datetime-local inputs, which want local time with no timezone suffix. */
export function toDateTimeLocal(value) {
  if (!value) return ''
  const date = new Date(value)
  const offset = date.getTimezoneOffset() * 60_000
  return new Date(date.getTime() - offset).toISOString().slice(0, 16)
}

export const BRANDS = ['Luxury Music Sounds', 'Easystrings', 'The Four Seasons']

export const ACCENT_CLASSES = {
  gold: {
    text: 'text-gold-lift',
    border: 'border-gold-deep',
    ring: 'ring-gold-deep',
    dot: 'bg-gold-lift',
  },
  royal: {
    text: 'text-royal-lift',
    border: 'border-royal-lift/50',
    ring: 'ring-royal-lift/50',
    dot: 'bg-royal-lift',
  },
  velvet: {
    text: 'text-velvet-lift',
    border: 'border-velvet/60',
    ring: 'ring-velvet/60',
    dot: 'bg-velvet-lift',
  },
}
