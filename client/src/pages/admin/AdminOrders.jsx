import { Download, Receipt, Search } from 'lucide-react'
import { useState } from 'react'
import { AdminHeader } from '../../components/admin/AdminLayout'
import { EmptyState, ErrorState, Spinner } from '../../components/States'
import { useApi } from '../../hooks/useApi'
import { adminApi } from '../../lib/api'
import { formatDate, formatMoney, formatTime } from '../../lib/format'

const STATUS_STYLES = {
  paid: 'border-gold-deep text-gold-lift',
  pending: 'border-ink-line text-ivory-dim',
  failed: 'border-velvet/60 text-velvet-lift',
  cancelled: 'border-ink-line text-ivory-faint',
  refunded: 'border-royal-lift/60 text-royal-lift',
}

export default function AdminOrders() {
  const [status, setStatus] = useState('paid')
  const [search, setSearch] = useState('')

  const { data, error, isLoading, reload } = useApi(
    () => adminApi.orders({ status, search }),
    [status, search],
  )

  const orders = data ?? []
  const revenue = orders
    .filter((order) => order.status === 'paid')
    .reduce((sum, order) => sum + order.total, 0)

  return (
    <>
      <AdminHeader
        title="Orders"
        description="Every ticket order across all events."
        action={
          orders.length > 0 ? (
            <button
              type="button"
              onClick={() => exportOrders(orders)}
              className="btn btn-gold btn-sm"
            >
              <Download size={14} strokeWidth={1.5} />
              Export CSV
            </button>
          ) : null
        }
      />

      <div className="mb-6 flex flex-wrap items-center gap-4">
        <div className="flex flex-wrap gap-2">
          {['paid', 'pending', 'failed', 'cancelled', 'all'].map((option) => (
            <button
              key={option}
              type="button"
              onClick={() => setStatus(option)}
              aria-pressed={status === option}
              className={`border px-3.5 py-2 font-sans text-[0.625rem] font-medium uppercase tracking-[0.16em] transition-colors ${
                status === option
                  ? 'border-gold-lift bg-gold-lift text-ink'
                  : 'border-ink-line text-ivory-dim hover:border-gold-deep hover:text-gold-lift'
              }`}
            >
              {option}
            </button>
          ))}
        </div>

        <div className="relative min-w-56 flex-1">
          <Search
            size={15}
            strokeWidth={1.5}
            className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-ivory-faint"
          />
          <input
            type="search"
            className="field pl-10"
            placeholder="Search reference, event, name or email"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            aria-label="Search orders"
          />
        </div>
      </div>

      {isLoading ? (
        <Spinner label="Loading orders" />
      ) : error ? (
        <ErrorState error={error} onRetry={reload} />
      ) : orders.length === 0 ? (
        <EmptyState
          icon={Receipt}
          title="No orders to show"
          description={
            search
              ? `Nothing matches "${search}".`
              : `No orders with the status "${status}" yet.`
          }
        />
      ) : (
        <>
          <div className="surface mb-4 flex flex-wrap gap-10 p-5">
            <div>
              <p className="u-eyebrow">Showing</p>
              <p className="mt-1 font-display text-2xl tabular-nums">{orders.length}</p>
            </div>
            <div>
              <p className="u-eyebrow">Paid value</p>
              <p className="mt-1 font-display text-2xl tabular-nums text-gold-lift">
                {formatMoney(revenue)}
              </p>
            </div>
            <div>
              <p className="u-eyebrow">Tickets</p>
              <p className="mt-1 font-display text-2xl tabular-nums">
                {orders.reduce((sum, order) => sum + order.quantity, 0)}
              </p>
            </div>
          </div>

          <div className="surface overflow-x-auto">
            <table className="w-full min-w-[52rem] text-sm">
              <thead>
                <tr className="border-b border-ink-line text-left">
                  {[
                    'Reference',
                    'Event',
                    'Customer',
                    'Tickets',
                    'Total',
                    'Status',
                    'Placed',
                  ].map((head) => (
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
                    <td className="max-w-56 p-4">
                      <p className="truncate text-ivory">{order.eventTitle}</p>
                      <p className="text-xs text-ivory-faint">
                        {formatDate(order.eventStartsAt, { year: undefined })}
                      </p>
                    </td>
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
                        className={`border px-2 py-1 text-[0.5625rem] uppercase tracking-[0.16em] ${STATUS_STYLES[order.status]}`}
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
        </>
      )}
    </>
  )
}

function exportOrders(orders) {
  const escape = (value) => '"' + String(value ?? '').replaceAll('"', '""') + '"'

  const header = [
    'Reference',
    'Event',
    'Event date',
    'Name',
    'Email',
    'Phone',
    'Tickets',
    'Total',
    'Currency',
    'Status',
    'Placed',
  ]

  const rows = orders.map((order) => [
    order.reference,
    order.eventTitle,
    order.eventStartsAt,
    order.customer.name,
    order.customer.email,
    order.customer.phone,
    order.quantity,
    order.total,
    order.currency,
    order.status,
    order.createdAt,
  ])

  const csv = [header, ...rows].map((row) => row.map(escape).join(',')).join('\n')
  // BOM keeps Excel from mangling names with accents.
  const blob = new Blob(['﻿' + csv], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)

  const link = document.createElement('a')
  link.href = url
  link.download = 'luxury-music-sounds-orders.csv'
  link.click()

  URL.revokeObjectURL(url)
}
