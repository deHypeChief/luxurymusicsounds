import { CalendarPlus, Crown, Pencil, Search, Trash2 } from 'lucide-react'
import { useState } from 'react'
import { Link } from 'react-router-dom'
import { AdminHeader } from '../../components/admin/AdminLayout'
import { EmptyState, ErrorState, Spinner } from '../../components/States'
import { useApi } from '../../hooks/useApi'
import { adminApi } from '../../lib/api'
import { formatDate, formatMoney, formatTime } from '../../lib/format'

const STATUS_STYLES = {
  published: 'border-gold-deep text-gold-lift',
  draft: 'border-ink-line text-ivory-dim',
  archived: 'border-ink-line text-ivory-faint',
}

export default function AdminEvents() {
  const [status, setStatus] = useState('all')
  const [search, setSearch] = useState('')
  const [busyId, setBusyId] = useState(null)
  const [actionError, setActionError] = useState(null)

  const { data, error, isLoading, reload } = useApi(
    () => adminApi.events({ status, search }),
    [status, search],
  )

  const events = data ?? []

  const toggleHeadline = async (event) => {
    setBusyId(event.id)
    setActionError(null)
    try {
      await adminApi.setHeadline(event.id, !event.isHeadline)
      reload()
    } catch (caught) {
      setActionError(caught.message)
    } finally {
      setBusyId(null)
    }
  }

  const removeEvent = async (event) => {
    const confirmed = window.confirm(
      `Delete "${event.title}"? This cannot be undone.\n\nIf tickets have been sold, archive it instead so the records survive.`,
    )
    if (!confirmed) return

    setBusyId(event.id)
    setActionError(null)
    try {
      await adminApi.deleteEvent(event.id)
      reload()
    } catch (caught) {
      setActionError(caught.message)
    } finally {
      setBusyId(null)
    }
  }

  return (
    <>
      <AdminHeader
        title="Events"
        description="Create events, set ticket tiers, and choose the headline."
        action={
          <Link to="/admin/events/new" className="btn btn-buy btn-sm">
            <CalendarPlus size={14} strokeWidth={1.5} />
            New event
          </Link>
        }
      />

      <div className="mb-6 flex flex-wrap items-center gap-4">
        <div className="flex gap-2" role="group" aria-label="Filter by status">
          {['all', 'published', 'draft', 'archived'].map((option) => (
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
            placeholder="Search by title"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            aria-label="Search events"
          />
        </div>
      </div>

      {actionError ? (
        <p role="alert" className="mb-6 border border-velvet/50 bg-velvet-deep/25 p-4 text-sm">
          {actionError}
        </p>
      ) : null}

      {isLoading ? (
        <Spinner label="Loading events" />
      ) : error ? (
        <ErrorState error={error} onRetry={reload} />
      ) : events.length === 0 ? (
        <EmptyState
          icon={CalendarPlus}
          title="No events here"
          description={
            search ? `Nothing matches "${search}".` : 'Create your first event to start selling.'
          }
          action={
            <Link to="/admin/events/new" className="btn btn-buy btn-sm">
              New event
            </Link>
          }
        />
      ) : (
        <div className="space-y-3">
          {events.map((event) => {
            const sellThrough =
              event.totalCapacity > 0
                ? Math.round((event.totalSold / event.totalCapacity) * 100)
                : 0

            return (
              <article
                key={event.id}
                className="surface flex flex-col gap-5 p-5 md:flex-row md:items-center"
              >
                <div className="h-24 w-full shrink-0 overflow-hidden bg-ink-soft md:w-36">
                  {event.posterImage ? (
                    <img src={event.posterImage} alt="" className="size-full object-cover" />
                  ) : null}
                </div>

                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span
                      className={`border px-2.5 py-1 font-sans text-[0.5625rem] font-medium uppercase tracking-[0.18em] ${STATUS_STYLES[event.status]}`}
                    >
                      {event.status}
                    </span>
                    {event.isHeadline ? (
                      <span className="bg-velvet px-2.5 py-1 font-sans text-[0.5625rem] font-medium uppercase tracking-[0.18em] text-ivory">
                        Headline
                      </span>
                    ) : null}
                    <span className="u-meta text-[0.625rem]">{event.brand}</span>
                  </div>

                  <h2 className="mt-2 truncate font-display text-xl font-bold">
                    <Link
                      to={`/admin/events/${event.id}`}
                      className="transition-colors hover:text-gold-lift"
                    >
                      {event.title}
                    </Link>
                  </h2>

                  <p className="mt-1 text-sm text-ivory-faint">
                    {formatDate(event.startsAt)} · {formatTime(event.startsAt)}
                    {event.venue?.name ? ` · ${event.venue.name}` : ''}
                  </p>
                </div>

                <div className="flex shrink-0 gap-8 md:w-56">
                  <div>
                    <p className="u-meta text-[0.5625rem]">Sold</p>
                    <p className="mt-1 font-display text-xl tabular-nums">
                      {event.totalSold}
                      <span className="text-sm text-ivory-faint">/{event.totalCapacity}</span>
                    </p>
                    <div className="mt-2 h-1 w-24 overflow-hidden bg-ink-soft">
                      <div
                        className="h-full bg-gold"
                        style={{ width: `${Math.min(sellThrough, 100)}%` }}
                      />
                    </div>
                  </div>

                  <div>
                    <p className="u-meta text-[0.5625rem]">Revenue</p>
                    <p className="mt-1 font-display text-xl tabular-nums text-gold-lift">
                      {formatMoney(event.grossRevenue)}
                    </p>
                  </div>
                </div>

                <div className="flex shrink-0 gap-2">
                  <button
                    type="button"
                    onClick={() => toggleHeadline(event)}
                    disabled={busyId === event.id}
                    title={event.isHeadline ? 'Remove headline status' : 'Make this the headline'}
                    aria-label={
                      event.isHeadline ? 'Remove headline status' : 'Make this the headline event'
                    }
                    className={`grid size-10 place-items-center border transition-colors disabled:opacity-40 ${
                      event.isHeadline
                        ? 'border-velvet bg-velvet/20 text-velvet-lift'
                        : 'border-ink-line text-ivory-dim hover:border-velvet hover:text-velvet-lift'
                    }`}
                  >
                    <Crown size={15} strokeWidth={1.5} />
                  </button>

                  <Link
                    to={`/admin/events/${event.id}`}
                    className="grid size-10 place-items-center border border-ink-line text-ivory-dim transition-colors hover:border-gold-deep hover:text-gold-lift"
                    aria-label={`Edit ${event.title}`}
                  >
                    <Pencil size={15} strokeWidth={1.5} />
                  </Link>

                  <button
                    type="button"
                    onClick={() => removeEvent(event)}
                    disabled={busyId === event.id}
                    className="grid size-10 place-items-center border border-ink-line text-ivory-dim transition-colors hover:border-velvet hover:text-velvet-lift disabled:opacity-40"
                    aria-label={`Delete ${event.title}`}
                  >
                    <Trash2 size={15} strokeWidth={1.5} />
                  </button>
                </div>
              </article>
            )
          })}
        </div>
      )}
    </>
  )
}
