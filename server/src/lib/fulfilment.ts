import { generateTicketCode } from './codes.ts'
import { releaseSeats } from './inventory.ts'
import { Order, type IOrder } from '../models/Order.ts'
import { Ticket, type ITicket } from '../models/Ticket.ts'

export interface PaymentDetails {
  reference?: string
  channel?: string | null
  paidAt?: Date | null
  raw?: unknown
}

/**
 * Turns a paid order into tickets. Both the Paystack webhook and the browser
 * returning from checkout call this, often within the same second, so the state
 * change is claimed with a single conditional update: whoever loses the race
 * gets the already-issued tickets back instead of minting duplicates.
 */
export async function fulfilOrder(
  order: IOrder,
  payment: PaymentDetails = {},
): Promise<{ order: IOrder; tickets: ITicket[]; alreadyFulfilled: boolean }> {
  const claimed = await Order.findOneAndUpdate(
    { _id: order._id, ticketsIssued: false },
    {
      $set: {
        ticketsIssued: true,
        status: 'paid',
        stockReserved: false,
        holdExpiresAt: null,
        'paystack.reference': payment.reference ?? order.paystack.reference,
        'paystack.channel': payment.channel ?? order.paystack.channel,
        'paystack.paidAt': payment.paidAt ?? new Date(),
        ...(payment.raw ? { 'paystack.raw': payment.raw } : {}),
      },
    },
    { new: true },
  )

  if (!claimed) {
    const tickets = await Ticket.find({ order: order._id }).sort({ createdAt: 1 })
    const current = await Order.findById(order._id)
    return { order: current ?? order, tickets, alreadyFulfilled: true }
  }

  const docs = claimed.items.flatMap((item) =>
    Array.from({ length: item.quantity }, () => ({
      code: generateTicketCode(),
      order: claimed._id,
      orderReference: claimed.reference,
      event: claimed.event,
      eventTitle: claimed.eventTitle,
      ticketTypeId: item.ticketTypeId,
      ticketTypeName: item.name,
      price: item.unitPrice,
      attendee: { name: claimed.customer.name, email: claimed.customer.email },
      status: 'valid' as const,
    })),
  )

  const tickets = await Ticket.insertMany(docs)

  return { order: claimed, tickets: tickets as unknown as ITicket[], alreadyFulfilled: false }
}

/** Marks an order failed and puts its held seats back on sale. */
export async function failOrder(order: IOrder, reason = 'failed'): Promise<void> {
  const claimed = await Order.findOneAndUpdate(
    { _id: order._id, status: 'pending', stockReserved: true },
    { $set: { status: reason === 'cancelled' ? 'cancelled' : 'failed', stockReserved: false } },
  )
  if (!claimed) return

  for (const item of claimed.items) {
    await releaseSeats(claimed.event, item.ticketTypeId, item.quantity)
  }
}
