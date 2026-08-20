import type { Types } from 'mongoose'
import { ApiError } from './http.ts'
import { Event } from '../models/Event.ts'
import { Order } from '../models/Order.ts'

export interface ReservationRequest {
  ticketTypeId: string
  quantity: number
}

export interface ReservedLine {
  ticketTypeId: Types.ObjectId
  name: string
  unitPrice: number
  quantity: number
  subtotal: number
}

/** How long an unpaid checkout may sit on stock before it goes back on sale. */
export const HOLD_MINUTES = 20

const MAX_ATTEMPTS = 4

/**
 * Moves `quantity` from available to held on one ticket type.
 *
 * `sold` counts held *and* paid seats, so it is the single number that gates
 * availability. The update is a compare-and-swap: it only applies if `sold` is
 * still what we read a moment ago, which makes concurrent buyers serialise
 * instead of both squeezing past the same "2 left" check.
 */
async function claimSeats(
  eventId: Types.ObjectId,
  ticketTypeId: string,
  quantity: number,
  expectedSold: number,
): Promise<boolean> {
  const result = await Event.updateOne(
    {
      _id: eventId,
      ticketTypes: { $elemMatch: { _id: ticketTypeId, sold: expectedSold } },
    },
    { $inc: { 'ticketTypes.$.sold': quantity } },
  )

  return result.modifiedCount === 1
}

export async function releaseSeats(
  eventId: Types.ObjectId,
  ticketTypeId: Types.ObjectId | string,
  quantity: number,
): Promise<void> {
  await Event.updateOne(
    { _id: eventId, 'ticketTypes._id': ticketTypeId },
    { $inc: { 'ticketTypes.$.sold': -quantity } },
  )
}

/**
 * Validates a basket against live availability and holds the stock.
 * Throws with a human-readable reason if any line cannot be satisfied, rolling
 * back whatever it had already claimed.
 */
export async function reserveSeats(
  eventId: Types.ObjectId,
  requests: ReservationRequest[],
): Promise<ReservedLine[]> {
  const claimed: ReservedLine[] = []

  const rollback = async () => {
    for (const line of claimed) {
      await releaseSeats(eventId, line.ticketTypeId, line.quantity)
    }
  }

  try {
    for (const request of requests) {
      let settled = false

      for (let attempt = 0; attempt < MAX_ATTEMPTS && !settled; attempt += 1) {
        const event = await Event.findById(eventId)
        if (!event) throw ApiError.notFound('We could not find that event')

        const type = event.ticketTypes.id(request.ticketTypeId)
        if (!type) throw ApiError.badRequest('One of the selected ticket types no longer exists')

        if (!type.isActive) {
          throw ApiError.conflict(`${type.name} is no longer on sale`)
        }

        const now = Date.now()
        if (type.salesStart && now < new Date(type.salesStart).getTime()) {
          throw ApiError.conflict(`${type.name} has not opened for sale yet`)
        }
        if (type.salesEnd && now > new Date(type.salesEnd).getTime()) {
          throw ApiError.conflict(`Sales for ${type.name} have closed`)
        }
        if (request.quantity > type.perOrderLimit) {
          throw ApiError.badRequest(
            `You can buy at most ${type.perOrderLimit} ${type.name} tickets per order`,
          )
        }

        const remaining = Math.max(0, type.quantity - type.sold)
        if (remaining === 0) {
          throw ApiError.conflict(`${type.name} is sold out`)
        }
        if (request.quantity > remaining) {
          throw ApiError.conflict(
            `Only ${remaining} ${type.name} ticket${remaining === 1 ? '' : 's'} left`,
          )
        }

        if (await claimSeats(event._id as Types.ObjectId, request.ticketTypeId, request.quantity, type.sold)) {
          claimed.push({
            ticketTypeId: type._id,
            name: type.name,
            unitPrice: type.price,
            quantity: request.quantity,
            subtotal: type.price * request.quantity,
          })
          settled = true
        }
        // Otherwise another buyer moved `sold` first, re-read and try again.
      }

      if (!settled) {
        throw ApiError.conflict(
          'These tickets are moving fast and we could not hold yours. Please try again.',
        )
      }
    }

    return claimed
  } catch (error) {
    await rollback()
    throw error
  }
}

/**
 * Puts stock from abandoned checkouts back on sale. Safe to call repeatedly:
 * the status change is claimed atomically, so only one caller releases a hold.
 */
export async function releaseExpiredHolds(): Promise<number> {
  const expired = await Order.find({
    status: 'pending',
    stockReserved: true,
    holdExpiresAt: { $lt: new Date() },
  }).limit(200)

  let released = 0

  for (const order of expired) {
    const claimedOrder = await Order.findOneAndUpdate(
      { _id: order._id, status: 'pending', stockReserved: true },
      { $set: { status: 'cancelled', stockReserved: false } },
    )
    if (!claimedOrder) continue

    for (const item of claimedOrder.items) {
      await releaseSeats(claimedOrder.event, item.ticketTypeId, item.quantity)
    }
    released += 1
  }

  if (released > 0) {
    console.log(`[inventory] released ${released} expired ticket hold(s)`)
  }

  return released
}
