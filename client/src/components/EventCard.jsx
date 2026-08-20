import { ArrowUpRight, MapPin, Ticket } from 'lucide-react'
import { Link } from 'react-router-dom'
import { ACCENT_CLASSES, formatDateParts, formatPrice, formatTime } from '../lib/format'

/**
 * Event card used across the home listing, the events index and search results.
 *
 * The date block is set as a torn-off calendar leaf rather than a line of text,
 * so a wall of cards can be scanned by date at a glance.
 */
export default function EventCard({ event, onBuy, priority = false }) {
  const accent = ACCENT_CLASSES[event.accent] ?? ACCENT_CLASSES.gold
  const date = formatDateParts(event.startsAt)
  const canBuy = event.ticketsOnSale && !event.isSoldOut

  return (
    <article className="group relative flex h-full flex-col overflow-hidden border border-ink-line bg-ink-raised transition-colors duration-500 hover:border-gold-deep">
      <Link
        to={`/events/${event.slug}`}
        className="relative block aspect-[4/3] overflow-hidden"
        tabIndex={-1}
        aria-hidden="true"
      >
        <img
          src={event.posterImage || event.heroImage}
          alt=""
          loading={priority ? 'eager' : 'lazy'}
          className="size-full object-cover transition-transform duration-[1.2s] ease-[cubic-bezier(0.16,1,0.3,1)] group-hover:scale-[1.06]"
        />
        <div className="scrim-soft absolute inset-0" />

        {/* Calendar leaf */}
        <div className="absolute left-4 top-4 border border-ink-line bg-ink/85 px-3 py-2 text-center backdrop-blur-sm">
          <p className="font-display text-2xl font-bold leading-none text-ivory">{date.day}</p>
          <p className="u-eyebrow mt-1 text-[0.5625rem]">{date.month}</p>
        </div>

        {event.isHeadline ? (
          <p className="absolute right-4 top-4 bg-velvet px-3 py-1.5 font-sans text-[0.5625rem] font-medium uppercase tracking-[0.24em] text-ivory">
            Headline
          </p>
        ) : event.isSoldOut ? (
          <p className="absolute right-4 top-4 border border-ivory/25 bg-ink/80 px-3 py-1.5 font-sans text-[0.5625rem] font-medium uppercase tracking-[0.24em] text-ivory-dim backdrop-blur-sm">
            Sold out
          </p>
        ) : null}
      </Link>

      <div className="flex flex-1 flex-col p-6">
        <p className={`u-eyebrow ${accent.text}`}>{event.brand}</p>

        <h3 className="mt-3 font-display text-2xl font-bold leading-tight">
          <Link
            to={`/events/${event.slug}`}
            className="transition-colors after:absolute after:inset-0 hover:text-gold-lift"
          >
            {event.title}
          </Link>
        </h3>

        {event.tagline ? (
          <p className="mt-2 line-clamp-2 text-sm leading-relaxed text-ivory-dim">
            {event.tagline}
          </p>
        ) : null}

        <div className="mb-6 mt-5 space-y-1.5 text-sm text-ivory-faint">
          <p>
            {date.weekday}, {formatTime(event.startsAt)}
          </p>
          {event.venue?.name ? (
            <p className="flex items-start gap-2">
              <MapPin size={14} strokeWidth={1.5} className="mt-0.5 shrink-0 text-gold" />
              <span className="truncate">
                {event.venue.name}
                {event.venue.city ? `, ${event.venue.city}` : ''}
              </span>
            </p>
          ) : null}
        </div>

        <div className="mt-auto flex items-end justify-between gap-4 border-t border-ink-line pt-5">
          <div>
            <p className="u-meta text-[0.625rem]">
              {event.isPast ? 'Took place' : event.isSoldOut ? 'Status' : 'From'}
            </p>
            <p className="mt-1 font-display text-xl font-semibold text-ivory">
              {event.isPast
                ? 'Archived'
                : event.isSoldOut
                  ? 'Sold out'
                  : formatPrice(event.lowestPrice)}
            </p>
          </div>

          {canBuy && onBuy ? (
            // Above the card-wide link, so this button wins the click.
            <button
              type="button"
              onClick={() => onBuy(event)}
              className="btn btn-buy btn-sm relative z-10"
            >
              <Ticket size={13} strokeWidth={1.5} />
              Tickets
            </button>
          ) : (
            <span className="relative z-10 flex items-center gap-1.5 text-sm text-ivory-dim transition-colors group-hover:text-gold-lift">
              Details
              <ArrowUpRight size={14} strokeWidth={1.5} />
            </span>
          )}
        </div>
      </div>
    </article>
  )
}
