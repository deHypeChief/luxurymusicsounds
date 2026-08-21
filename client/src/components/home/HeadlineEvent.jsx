import { MapPin, Ticket } from 'lucide-react'
import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { countdownParts, formatDate, formatPrice, formatTime } from '../../lib/format'
import Reveal from '../Reveal'
import { Movement, Script } from '../Typography'

/** Ticks once a second while a future date is pending, then stops. */
function useCountdown(target) {
  const [parts, setParts] = useState(() => countdownParts(target))

  useEffect(() => {
    if (!target) return

    setParts(countdownParts(target))
    const timer = setInterval(() => {
      const next = countdownParts(target)
      setParts(next)
      if (!next) clearInterval(timer)
    }, 1000)

    return () => clearInterval(timer)
  }, [target])

  return parts
}

function CountdownUnit({ value, label }) {
  return (
    <div className="text-center">
      <p className="font-display text-3xl font-bold tabular-nums text-ivory md:text-5xl">
        {String(value).padStart(2, '0')}
      </p>
      <p className="u-eyebrow mt-1.5 text-[0.5625rem]">{label}</p>
    </div>
  )
}

/**
 * The headline (special) event. It gets the full-bleed treatment and a live
 * countdown. This is the one date the house wants you to leave with.
 */
export default function HeadlineEvent({ event, onBuy }) {
  const countdown = useCountdown(event?.startsAt)

  if (!event) return null

  const canBuy = event.ticketsOnSale

  return (
    <section id="programme" className="relative overflow-hidden wash-royal py-20 md:py-28">
      <div className="shell">
        <Reveal>
          <Movement label="The headline event" />
        </Reveal>

        <div className="mt-12 grid gap-12 lg:grid-cols-[1.15fr_1fr] lg:items-center lg:gap-16">
          <Reveal className="relative">
            <div className="relative aspect-[4/5] overflow-hidden sm:aspect-[3/2] lg:aspect-[4/5]">
              <img
                src={event.heroImage || event.posterImage}
                alt=""
                className="size-full object-cover"
              />
              <div className="scrim-soft absolute inset-0" />

              <p className="absolute left-5 top-5 bg-velvet px-4 py-2 font-sans text-[0.5625rem] font-medium uppercase tracking-[0.28em] text-ivory">
                Special event
              </p>
            </div>
          </Reveal>

          <Reveal delay={0.12}>
            <p className="u-eyebrow">{event.brand}</p>

            <h2 className="u-display mt-4 text-[length:var(--text-display)]">{event.title}</h2>

            {event.tagline ? (
              <p className="mt-5 font-display text-xl italic text-gold-lift">{event.tagline}</p>
            ) : null}

            <div className="mt-8 space-y-2 text-ivory-dim">
              <p>
                {formatDate(event.startsAt)} · {formatTime(event.startsAt)}
                {event.doorsOpenAt ? (
                  <span className="text-ivory-faint">
                    {' '}
                    · doors {formatTime(event.doorsOpenAt)}
                  </span>
                ) : null}
              </p>
              {event.venue?.name ? (
                <p className="flex items-start gap-2">
                  <MapPin size={16} strokeWidth={1.5} className="mt-1 shrink-0 text-gold" />
                  <span>
                    {event.venue.name}
                    {event.venue.city ? `, ${event.venue.city}` : ''}
                  </span>
                </p>
              ) : null}
            </div>

            {countdown ? (
              <div className="mt-10 border-y border-ink-line py-6">
                <p className="u-meta mb-4">Doors in</p>
                <div className="flex gap-8">
                  <CountdownUnit value={countdown.days} label="Days" />
                  <CountdownUnit value={countdown.hours} label="Hrs" />
                  <CountdownUnit value={countdown.minutes} label="Min" />
                  <CountdownUnit value={countdown.seconds} label="Sec" />
                </div>
              </div>
            ) : null}

            <div className="mt-8 flex flex-wrap items-center gap-4">
              {canBuy ? (
                <>
                  <button type="button" onClick={() => onBuy(event)} className="btn btn-buy">
                    <Ticket size={15} strokeWidth={1.5} />
                    Buy tickets
                  </button>
                  <p className="text-sm text-ivory-dim">
                    From{' '}
                    <span className="font-display text-lg text-ivory">
                      {formatPrice(event.lowestPrice)}
                    </span>
                  </p>
                </>
              ) : (
                <p className="u-meta text-velvet-lift">
                  Tickets not yet on sale
                </p>
              )}

              <Link to={`/events/${event.slug}`} className="btn btn-ghost">
                Full programme
              </Link>
            </div>
          </Reveal>
        </div>
      </div>
    </section>
  )
}

/** The compact promo used inside the auto-opening dialog. */
export function HeadlinePromo({ event, onBuy, onDismiss }) {
  const countdown = useCountdown(event?.startsAt)

  if (!event) return null

  return (
    <div className="grid sm:grid-cols-[0.9fr_1.1fr]">
      {/*
        The poster is absolutely placed on wider screens so it fills whatever
        height the copy needs. Letting a tall portrait image size the row is
        what left a block of dead space under the buttons.
      */}
      <div className="relative aspect-[16/10] overflow-hidden sm:aspect-auto">
        <img
          src={event.posterImage || event.heroImage}
          alt=""
          className="size-full object-cover sm:absolute sm:inset-0"
        />
        <div className="scrim absolute inset-0 sm:bg-gradient-to-r sm:from-transparent sm:to-ink-raised" />
      </div>

      <div className="p-7 sm:p-9">
        <p className="mb-4 inline-block bg-velvet px-3 py-1.5 font-sans text-[0.5625rem] font-medium uppercase tracking-[0.28em] text-ivory">
          Special event
        </p>

        <h2 className="u-display text-3xl md:text-4xl">
          {event.title.split(' ').slice(0, -1).join(' ')}{' '}
          <Script>{event.title.split(' ').slice(-1)}</Script>
        </h2>

        {event.tagline ? (
          <p className="mt-3 text-sm leading-relaxed text-ivory-dim">{event.tagline}</p>
        ) : null}

        <p className="u-meta mt-5">
          {formatDate(event.startsAt)} · {formatTime(event.startsAt)}
        </p>
        {event.venue?.name ? (
          <p className="mt-1 text-sm text-ivory-faint">
            {event.venue.name}
            {event.venue.city ? `, ${event.venue.city}` : ''}
          </p>
        ) : null}

        {countdown ? (
          <div className="mt-6 flex gap-6 border-y border-ink-line py-4">
            <CountdownUnit value={countdown.days} label="Days" />
            <CountdownUnit value={countdown.hours} label="Hrs" />
            <CountdownUnit value={countdown.minutes} label="Min" />
          </div>
        ) : null}

        <div className="mt-7 flex flex-col gap-3">
          <button type="button" onClick={onBuy} className="btn btn-buy w-full">
            <Ticket size={15} strokeWidth={1.5} />
            Buy tickets from {formatPrice(event.lowestPrice)}
          </button>
          <button
            type="button"
            onClick={onDismiss}
            className="font-sans text-xs uppercase tracking-[0.18em] text-ivory-faint transition-colors hover:text-ivory"
          >
            Maybe later
          </button>
        </div>
      </div>
    </div>
  )
}
