import { Router } from 'express'
import { ApiError, asyncHandler } from '../../lib/http.ts'
import type { AuthedRequest } from '../../middleware/auth.ts'
import { Ticket } from '../../models/Ticket.ts'

const router = Router()

function ticketView(ticket: {
  _id: unknown
  code: string
  eventTitle: string
  ticketTypeName: string
  orderReference: string
  attendee: { name: string; email: string }
  status: string
  checkedInAt: Date | null
  checkedInBy: string
}) {
  return {
    id: String(ticket._id),
    code: ticket.code,
    eventTitle: ticket.eventTitle,
    ticketType: ticket.ticketTypeName,
    orderReference: ticket.orderReference,
    attendee: ticket.attendee,
    status: ticket.status,
    checkedInAt: ticket.checkedInAt,
    checkedInBy: ticket.checkedInBy,
  }
}

/** GET /api/admin/tickets/:code: door staff looking a ticket up before admitting. */
router.get(
  '/:code',
  asyncHandler(async (req, res) => {
    const ticket = await Ticket.findOne({ code: req.params.code.trim().toUpperCase() })
    if (!ticket) throw ApiError.notFound('No ticket matches that code')

    res.json({ success: true, data: ticketView(ticket) })
  }),
)

/**
 * POST /api/admin/tickets/:code/check-in
 * Admits a guest exactly once. The status change is claimed conditionally so
 * two doors scanning the same code cannot both wave the guest through.
 */
router.post(
  '/:code/check-in',
  asyncHandler(async (req: AuthedRequest, res) => {
    const code = req.params.code.trim().toUpperCase()

    const ticket = await Ticket.findOne({ code })
    if (!ticket) throw ApiError.notFound('No ticket matches that code')

    if (ticket.status === 'void') {
      throw ApiError.conflict('This ticket has been voided')
    }

    const claimed = await Ticket.findOneAndUpdate(
      { code, status: 'valid' },
      {
        $set: {
          status: 'used',
          checkedInAt: new Date(),
          checkedInBy: req.admin?.name ?? 'Admin',
        },
      },
      { new: true },
    )

    if (!claimed) {
      res.status(409).json({
        success: false,
        message: `Already checked in${ticket.checkedInAt ? ` at ${ticket.checkedInAt.toLocaleString()}` : ''}`,
        data: ticketView(ticket),
      })
      return
    }

    res.json({ success: true, message: 'Checked in', data: ticketView(claimed) })
  }),
)

/** POST /api/admin/tickets/:code/undo-check-in: for the inevitable mis-scan. */
router.post(
  '/:code/undo-check-in',
  asyncHandler(async (req, res) => {
    const ticket = await Ticket.findOneAndUpdate(
      { code: req.params.code.trim().toUpperCase(), status: 'used' },
      { $set: { status: 'valid', checkedInAt: null, checkedInBy: '' } },
      { new: true },
    )
    if (!ticket) throw ApiError.notFound('No checked-in ticket matches that code')

    res.json({ success: true, message: 'Check-in undone', data: ticketView(ticket) })
  }),
)

/** POST /api/admin/tickets/:code/void */
router.post(
  '/:code/void',
  asyncHandler(async (req, res) => {
    const ticket = await Ticket.findOneAndUpdate(
      { code: req.params.code.trim().toUpperCase() },
      { $set: { status: 'void' } },
      { new: true },
    )
    if (!ticket) throw ApiError.notFound('No ticket matches that code')

    res.json({ success: true, message: 'Ticket voided', data: ticketView(ticket) })
  }),
)

export default router
