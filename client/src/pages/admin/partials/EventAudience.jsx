import { Check, Download, Search, Undo2 } from 'lucide-react'
import { useState } from 'react'
import { EmptyState, ErrorState, Spinner } from '../../../components/States'
import { useApi } from '../../../hooks/useApi'
import { adminApi } from '../../../lib/api'
import { formatDate, formatMoney, formatTime } from '../../../lib/format'

const ORDER_STATUS_STYLES = {
  paid: 'border-gold-deep text-gold-lift',
  pending: 'border-ink-line text-ivory-dim',
  failed: 'border-velvet/60 text-velvet-lift',
  cancelled: 'border-ink-line text-ivory-faint',
  refunded: 'border-royal-lift/60 text-royal-lift',
}

/** Orders and attendees for one event, with check-in from the attendee list. */
export default function EventAudience({ eventId }) {
  const [view, setView] = useState('orders')

  return (
    <div>
      <div className="mb-6 flex gap-2">
        {[
          { id: 'orders', label: 'Orders' },
          { id: 'attendees', label: 'Attendees' },
        ].map((option) => (
          <button
            key={option.id}
            type="button"
            onClick={() => setView(option.id)}
            aria-pressed={view === option.id}
            className={`border px-4 py-2 font-sans text-[0.625rem] font-medium uppercase tracking-[0.16em] transition-colors ${
              view === option.id
                ? 'border-gold-lift bg-gold-lift text-ink'
                : 'border-ink-line text-ivory-dim hover:border-gold-deep hover:text-gold-lift'
            }`}
          >
            {option.label}
          </button>
        ))}
      </div>

      {view === 'orders' ? <OrdersTable eventId={eventId} /> : <AttendeesTable eventId={eventId} />}
    </div>
  )
}

function OrdersTable({ eventId }) {
  const [status, setStatus] = useState('paid')
  const { data, error, isLoading, reload } = useApi(
    () => adminApi.eventOrders(eventId, { status }),
    [eventId, status],
  )

  const orders = data ?? []

  if (isLoading) return <Spinner label="Loading orders" />
  if (error) return <ErrorState error={error} onRetry={reload} />

  return (
    <>
      <div className="mb-4 flex flex-wrap items-center justify-between gap-4">
        <div className="flex gap-2">
          {['paid', 'pending', 'failed', 'all'].map((option) => (
            <button
              key={option}
              type="button"
              onClick={() => setStatus(option)}
              aria-pressed={status === option}
              className={`border px-3 py-1.5 font-sans text-[0.5625rem] uppercase tracking-[0.16em] transition-colors ${
                status === option
                  ? 'border-ivory text-ivory'
                  : 'border-ink-line text-ivory-faint hover:text-ivory'
              }`}
            >
              {option}
            </button>
          ))}
        </div>

        {orders.length > 0 ? (
          <button
            type="button"
            onClick={() => downloadCsv(orders, `orders-${eventId}.csv`, ordersToCsv)}
            className="flex items-center gap-2 text-xs text-ivory-dim transition-colors hover:text-gold-lift"
          >
            <Download size={13} strokeWidth={1.5} />
            Export CSV
          </button>
        ) : null}
      </div>

      {orders.length === 0 ? (
        <EmptyState
          title="No orders here"
          description={`Nothing with the status "${status}" for this event yet.`}
        />
      ) : (
        <div className="surface overflow-x-auto">
          <table className="w-full min-w-[44rem] text-sm">
            <thead>
              <tr className="border-b border-ink-line text-left">
                {['Reference', 'Customer', 'Tickets', 'Total', 'Status', 'Placed'].map((head) => (
                  <th key={head} className="u-eyebrow p-4 text-[0.5625rem]">
                    {head}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-ink-line">
              {orders.map((order) => (
                <tr key={order.id} className="transition-colors hover:bg-ink-soft/40">
                  <td className="p-4 font-mono text-xs text-ivory-dim">{order.reference}</td>
                  <td className="p-4">
                    <p className="text-ivory">{order.customer.name}</p>
                    <p className="text-xs text-ivory-faint">{order.customer.email}</p>
                  </td>
                  <td className="p-4 tabular-nums">{order.quantity}</td>
                  <td className="p-4 font-display text-base tabular-nums text-gold-lift">
                    {formatMoney(order.total, order.currency)}
                  </td>
                  <td className="p-4">
                    <span
                      className={`border px-2 py-1 text-[0.5625rem] uppercase tracking-[0.16em] ${ORDER_STATUS_STYLES[order.status]}`}
                    >
                      {order.status}
                    </span>
                  </td>
                  <td className="p-4 text-xs text-ivory-faint">
                    {formatDate(order.createdAt, { year: undefined })}
                    <br />
                    {formatTime(order.createdAt)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </>
  )
}

function AttendeesTable({ eventId }) {
  const [search, setSearch] = useState('')
  const [busyCode, setBusyCode] = useState(null)
  const [actionError, setActionError] = useState(null)

  const { data, error, isLoading, reload } = useApi(
    () => adminApi.eventAttendees(eventId, { search }),
    [eventId, search],
  )

  const attendees = data ?? []
  const checkedIn = attendees.filter((ticket) => ticket.status === 'used').length

  const toggle = async (ticket) => {
    setBusyCode(ticket.code)
    setActionError(null)
    try {
      if (ticket.status === 'used') {
        await adminApi.undoCheckIn(ticket.code)
      } else {
        await adminApi.checkIn(ticket.code)
      }
      reload()
    } catch (caught) {
      setActionError(caught.message)
    } finally {
      setBusyCode(null)
    }
  }

  if (isLoading) return <Spinner label="Loading attendees" />
  if (error) return <ErrorState error={error} onRetry={reload} />

  return (
    <>
      <div className="mb-4 flex flex-wrap items-center justify-between gap-4">
        <div className="relative min-w-56 flex-1 max-w-md">
          <Search
            size={15}
            strokeWidth={1.5}
            className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-ivory-faint"
          />
          <input
            type="search"
            className="field pl-10"
            placeholder="Search name, email or ticket code"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            aria-label="Search attendees"
          />
        </div>

        <div className="flex items-center gap-5">
          <p className="u-meta">
            {checkedIn} / {attendees.length} checked in
          </p>
          {attendees.length > 0 ? (
            <button
              type="button"
              onClick={() =>
                downloadCsv(attendees, `attendees-${eventId}.csv`, attendeesToCsv)
              }
              className="flex items-center gap-2 text-xs text-ivory-dim transition-colors hover:text-gold-lift"
            >
              <Download size={13} strokeWidth={1.5} />
              Export CSV
            </button>
          ) : null}
        </div>
      </div>

      {actionError ? (
        <p role="alert" className="mb-4 border border-velvet/50 bg-velvet-deep/25 p-4 text-sm">
          {actionError}
        </p>
      ) : null}

      {attendees.length === 0 ? (
        <EmptyState
          title="No attendees yet"
          description={
            search
              ? `Nothing matches "${search}".`
              : 'Tickets appear here the moment an order is paid.'
          }
        />
      ) : (
        <div className="surface overflow-x-auto">
          <table className="w-full min-w-[44rem] text-sm">
            <thead>
              <tr className="border-b border-ink-line text-left">
                {['Code', 'Attendee', 'Tier', 'Status', ''].map((head, index) => (
                  <th key={index} className="u-eyebrow p-4 text-[0.5625rem]">
                    {head}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-ink-line">
              {attendees.map((ticket) => (
                <tr key={ticket.id} className="transition-colors hover:bg-ink-soft/40">
                  <td className="p-4 font-display text-base font-semibold tracking-wider">
                    {ticket.code}
                  </td>
                  <td className="p-4">
                    <p className="text-ivory">{ticket.attendee.name}</p>
                    <p className="text-xs text-ivory-faint">{ticket.attendee.email}</p>
                  </td>
                  <td className="p-4 text-ivory-dim">{ticket.ticketType}</td>
                  <td className="p-4">
                    {ticket.status === 'used' ? (
                      <span className="flex items-center gap-1.5 text-xs text-gold-lift">
                        <Check size={13} strokeWidth={2} />
                        In at {formatTime(ticket.checkedInAt)}
                      </span>
                    ) : ticket.status === 'void' ? (
                      <span className="text-xs text-velvet-lift">Void</span>
                    ) : (
                      <span className="text-xs text-ivory-faint">Not arrived</span>
                    )}
                  </td>
                  <td className="p-4 text-right">
                    <button
                      type="button"
                      onClick={() => toggle(ticket)}
                      disabled={busyCode === ticket.code || ticket.status === 'void'}
                      className="border border-ink-line px-3 py-1.5 text-[0.5625rem] uppercase tracking-[0.16em] text-ivory-dim transition-colors hover:border-gold-deep hover:text-gold-lift disabled:opacity-30"
                    >
                      {ticket.status === 'used' ? (
                        <span className="flex items-center gap-1.5">
                          <Undo2 size={11} strokeWidth={1.5} />
                          Undo
                        </span>
                      ) : (
                        'Check in'
                      )}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </>
  )
}

/* --- CSV export ----------------------------------------------------------- */

const escapeCell = (value) => `"${String(value ?? '').replaceAll('"', '""')}"`

function ordersToCsv(orders) {
  const header = ['Reference', 'Name', 'Email', 'Phone', 'Tickets', 'Total', 'Status', 'Placed']
  const rows = orders.map((order) => [
    order.reference,
    order.customer.name,
    order.customer.email,
    order.customer.phone,
    order.quantity,
    order.total,
    order.status,
    order.createdAt,
  ])
  return [header, ...rows].map((row) => row.map(escapeCell).join(',')).join('\n')
}

function attendeesToCsv(attendees) {
  const header = ['Code', 'Name', 'Email', 'Tier', 'Status', 'Checked in at', 'Order']
  const rows = attendees.map((ticket) => [
    ticket.code,
    ticket.attendee.name,
    ticket.attendee.email,
    ticket.ticketType,
    ticket.status,
    ticket.checkedInAt ?? '',
    ticket.orderReference,
  ])
  return [header, ...rows].map((row) => row.map(escapeCell).join(',')).join('\n')
}

function downloadCsv(rows, filename, serialise) {
  // BOM keeps Excel from mangling names with accents.
  const blob = new Blob(['﻿' + serialise(rows)], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)

  const link = document.createElement('a')
  link.href = url
  link.download = filename
  link.click()

  URL.revokeObjectURL(url)
}
