import { customAlphabet } from 'nanoid'

/** Crockford-ish alphabet: no 0/O/1/I/L so codes survive being read aloud at a door. */
const READABLE = '23456789ABCDEFGHJKMNPQRSTUVWXYZ'

const ticketId = customAlphabet(READABLE, 10)
const referenceId = customAlphabet(READABLE, 12)

export function generateTicketCode(): string {
  const raw = ticketId()
  return `LMS-${raw.slice(0, 5)}-${raw.slice(5)}`
}

export function generateOrderReference(): string {
  return `LMS_${Date.now().toString(36).toUpperCase()}_${referenceId()}`
}

export function slugify(value: string): string {
  return value
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 90)
}
