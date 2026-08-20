import {
  AlertTriangle,
  CalendarDays,
  CheckCircle2,
  Images,
  Plus,
  Receipt,
  Ticket,
  Wallet,
} from 'lucide-react'
import { Link } from 'react-router-dom'
import { AdminHeader } from '../../components/admin/AdminLayout'
import { EmptyState, ErrorState, Spinner } from '../../components/States'
import { useApi } from '../../hooks/useApi'
import { adminApi } from '../../lib/api'
import { formatDate, formatMoney, formatTime } from '../../lib/format'

function Stat({ icon: Icon, label, value, hint }) {
  return (
    <div className="surface p-6">
      <div className="mb-4 flex items-center justify-between">
        <p className="u-eyebrow">{label}</p>
        <Icon size={16} strokeWidth={1.5} className="text-gold-deep" />
      </div>
      <p className="font-display text-4xl font-bold tabular-nums">{value}</p>
      {hint ? <p className="mt-2 text-xs text-ivory-faint">{hint}</p> : null}
    </div>
  )
}

export default function AdminDashboard() {
  const { data, error, isLoading, reload } = useApi(() => adminApi.stats(), [])

  if (isLoading) return <Spinner label="Loading dashboard" />
  if (error) return <ErrorState error={error} onRetry={reload} />

  const missingIntegrations = [
    !data.integrations.paystack && 'Paystack',
    !data.integrations.cloudflareImages && 'Cloudflare Images',
  ].filter(Boolean)

  return (
    <>
      <AdminHeader
        title="Dashboard"
        description="Everything at a glance."
        action={
          <Link to="/admin/events/new" className="btn btn-buy btn-sm">
            <Plus size={14} strokeWidth={1.5} />
            New event
          </Link>
        }
      />

      {missingIntegrations.length > 0 ? (
        <div className="mb-8 flex items-start gap-3 border border-gold-deep bg-gold/8 p-5">
          <AlertTriangle size={18} strokeWidth={1.5} className="mt-0.5 shrink-0 text-gold-lift" />
          <div>
            <p className="text-sm text-ivory">
              {missingIntegrations.join(' and ')}{' '}
              {missingIntegrations.length === 1 ? 'is' : 'are'} not configured yet.
            </p>
            <p className="mt-1 text-xs text-ivory-dim">
              {missingIntegrations.includes('Paystack')
                ? 'Ticket sales stay switched off until the Paystack keys are set. '
                : ''}
              {missingIntegrations.includes('Cloudflare Images')
                ? 'Image uploads need the Cloudflare credentials. '
                : ''}
              Add them to the server&rsquo;s .env file and restart the API.
            </p>
          </div>
        </div>
      ) : null}

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Stat
          icon={Wallet}
          label="Gross revenue"
          value={formatMoney(data.revenue.gross, data.revenue.currency)}
          hint={`${data.revenue.orders} paid order${data.revenue.orders === 1 ? '' : 's'}`}
        />
        <Stat
          icon={Ticket}
          label="Tickets issued"
          value={data.tickets.issued}
          hint={`${data.tickets.checkedIn} checked in at the door`}
        />
        <Stat
          icon={CalendarDays}
          label="Upcoming events"
          value={data.events.upcoming}
          hint={`${data.events.published} published · ${data.events.draft} draft`}
        />
        <Stat icon={Images} label="Gallery images" value={data.gallery.total} />
      </div>

      <div className="mt-8 grid gap-6 lg:grid-cols-[1.3fr_1fr]">
        <section className="surface">
          <header className="flex items-center justify-between border-b border-ink-line p-6">
            <h2 className="font-display text-xl font-semibold">Recent orders</h2>
            <Link to="/admin/orders" className="u-meta transition-colors hover:text-gold-lift">
              View all
            </Link>
          </header>

          {data.recentOrders.length === 0 ? (
            <EmptyState
              className="border-0"
              icon={Receipt}
              title="No orders yet"
              description="Paid orders will appear here as soon as tickets start selling."
            />
          ) : (
            <ul className="divide-y divide-ink-line">
              {data.recentOrders.map((order) => (
                <li key={order.id} className="flex items-center justify-between gap-4 p-5">
                  <div className="min-w-0">
                    <p className="truncate text-sm text-ivory">{order.customer}</p>
                    <p className="truncate text-xs text-ivory-faint">{order.eventTitle}</p>
                  </div>
                  <div className="shrink-0 text-right">
                    <p className="font-display text-lg tabular-nums text-gold-lift">
                      {formatMoney(order.total, order.currency)}
                    </p>
                    <p className="text-xs text-ivory-faint">
                      {order.quantity} ticket{order.quantity === 1 ? '' : 's'}
                    </p>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </section>

        <section className="surface p-6">
          <h2 className="font-display text-xl font-semibold">Next up</h2>

          {data.nextEvent ? (
            <>
              <div className="mt-5 aspect-[3/2] overflow-hidden">
                <img
                  src={data.nextEvent.posterImage || data.nextEvent.heroImage}
                  alt=""
                  className="size-full object-cover"
                />
              </div>

              <p className="u-eyebrow mt-5">{data.nextEvent.brand}</p>
              <h3 className="mt-2 font-display text-2xl font-bold leading-tight">
                {data.nextEvent.title}
              </h3>
              <p className="mt-2 text-sm text-ivory-dim">
                {formatDate(data.nextEvent.startsAt)} · {formatTime(data.nextEvent.startsAt)}
              </p>

              <div className="mt-5 flex items-center gap-2 text-sm">
                {data.nextEvent.ticketsOnSale ? (
                  <>
                    <CheckCircle2 size={15} strokeWidth={1.5} className="text-gold-lift" />
                    <span className="text-ivory-dim">Tickets on sale</span>
                  </>
                ) : (
                  <>
                    <AlertTriangle size={15} strokeWidth={1.5} className="text-velvet-lift" />
                    <span className="text-ivory-dim">
                      {data.nextEvent.isSoldOut ? 'Sold out' : 'Not on sale'}
                    </span>
                  </>
                )}
              </div>

              <Link
                to={`/admin/events/${data.nextEvent.id}`}
                className="btn btn-gold btn-sm mt-6 w-full"
              >
                Manage this event
              </Link>
            </>
          ) : (
            <EmptyState
              className="mt-5 border-0"
              icon={CalendarDays}
              title="Nothing scheduled"
              description="Create an event to start selling."
              action={
                <Link to="/admin/events/new" className="btn btn-buy btn-sm">
                  <Plus size={14} strokeWidth={1.5} />
                  New event
                </Link>
              }
            />
          )}
        </section>
      </div>
    </>
  )
}
