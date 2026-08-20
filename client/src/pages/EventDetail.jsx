import { ArrowLeft, Clock, MapPin, Ticket } from 'lucide-react'
import { useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import Reveal from '../components/Reveal'
import TicketDialog from '../components/TicketDialog'
import { Script } from '../components/Typography'
import { FeatureVideo } from '../components/VideoPlayer'
import { useDocumentTitle } from '../hooks/useDocumentTitle'
import { findEvent } from '../content/events'
import { formatDate, formatPrice, formatTime } from '../lib/format'

export default function EventDetail() {
  const { slug } = useParams()
  const [isBuying, setIsBuying] = useState(false)

  const event = findEvent(slug)

  useDocumentTitle(event?.title ?? null)

  if (!event) {
    return (
      <div className="shell py-40 text-center">
        <p className="u-eyebrow">Not found</p>
        <h1 className="u-display mt-4 text-[length:var(--text-display)]">No such evening</h1>
        <p className="mx-auto mt-6 max-w-md text-ivory-dim">
          That date is not in the diary. It may have passed, or the link may be wrong.
        </p>
        <Link to="/events" className="btn btn-ghost mt-8">
          <ArrowLeft size={14} strokeWidth={1.5} />
          All events
        </Link>
      </div>
    )
  }

  const canBuy = event.ticketsOnSale
  const paragraphs = event.description.split('\n').filter(Boolean)

  return (
    <>
      {/* Full-bleed opener */}
      <header className="relative grain min-h-[85svh] overflow-hidden">
        <img
          src={event.heroImage || event.posterImage}
          alt=""
          fetchPriority="high"
          className="absolute inset-0 size-full object-cover"
        />
        <div className="scrim absolute inset-0" />

        <div className="shell relative flex min-h-[85svh] flex-col justify-end pb-14 pt-32">
          <Link
            to="/events"
            className="group mb-8 flex w-fit items-center gap-2 text-ivory-dim transition-colors hover:text-gold-lift"
          >
            <ArrowLeft
              size={15}
              strokeWidth={1.5}
              className="transition-transform duration-500 group-hover:-translate-x-1"
            />
            <span className="u-meta">All events</span>
          </Link>

          <div className="flex flex-wrap items-center gap-3">
            <p className="u-eyebrow">{event.brand}</p>
            {event.isHeadline ? (
              <span className="bg-velvet px-3 py-1 font-sans text-[0.5625rem] font-medium uppercase tracking-[0.24em] text-ivory">
                Special event
              </span>
            ) : null}
          </div>

          <h1 className="u-display mt-5 max-w-5xl text-[length:var(--text-hero)]">
            {event.title}
          </h1>

          {event.tagline ? (
            <p className="mt-6 max-w-2xl font-display text-2xl italic text-gold-lift">
              {event.tagline}
            </p>
          ) : null}
        </div>
      </header>

      <div className="shell grid gap-14 py-16 lg:grid-cols-[1.4fr_1fr] lg:gap-20 lg:py-24">
        <div>
          <Reveal>
            <dl className="grid gap-8 border-y border-ink-line py-8 sm:grid-cols-3">
              <div>
                <dt className="u-eyebrow mb-2">Date</dt>
                <dd className="font-display text-xl">{formatDate(event.startsAt)}</dd>
              </div>
              <div>
                <dt className="u-eyebrow mb-2">Time</dt>
                <dd className="font-display text-xl">
                  {formatTime(event.startsAt)}
                  {event.endsAt ? ` – ${formatTime(event.endsAt)}` : ''}
                </dd>
                {event.doorsOpenAt ? (
                  <dd className="mt-1 flex items-center gap-1.5 text-xs text-ivory-faint">
                    <Clock size={12} strokeWidth={1.5} />
                    Doors {formatTime(event.doorsOpenAt)}
                  </dd>
                ) : null}
              </div>
              <div>
                <dt className="u-eyebrow mb-2">Venue</dt>
                <dd className="font-display text-xl">{event.venue?.name || 'To be announced'}</dd>
                {event.venue?.address ? (
                  <dd className="mt-1 flex items-start gap-1.5 text-xs text-ivory-faint">
                    <MapPin size={12} strokeWidth={1.5} className="mt-0.5 shrink-0" />
                    {event.venue.address}
                    {event.venue.city ? `, ${event.venue.city}` : ''}
                  </dd>
                ) : null}
              </div>
            </dl>
          </Reveal>

          {paragraphs.length > 0 ? (
            <Reveal delay={0.08} className="mt-12">
              <h2 className="u-display text-[length:var(--text-title)]">
                The <Script>evening</Script>
              </h2>
              <div className="mt-6 space-y-5 text-lg leading-relaxed text-ivory-dim">
                {paragraphs.map((paragraph, index) => (
                  <p key={index}>{paragraph}</p>
                ))}
              </div>
            </Reveal>
          ) : null}

          {event.lineup?.length > 0 ? (
            <Reveal delay={0.08} className="mt-14">
              <h2 className="u-display text-[length:var(--text-title)]">
                Who is <Script>playing</Script>
              </h2>
              <ul className="mt-8 grid gap-6 sm:grid-cols-2">
                {event.lineup.map((artist, index) => (
                  <li key={index} className="flex items-center gap-4">
                    {artist.image ? (
                      <img
                        src={artist.image}
                        alt=""
                        loading="lazy"
                        className="size-20 shrink-0 object-cover"
                      />
                    ) : (
                      <span className="grid size-20 shrink-0 place-items-center border border-ink-line font-display text-2xl text-gold-deep">
                        {artist.name.charAt(0)}
                      </span>
                    )}
                    <div className="min-w-0">
                      <p className="font-display text-xl font-semibold">{artist.name}</p>
                      <p className="u-meta mt-1 text-[0.6875rem]">{artist.role}</p>
                    </div>
                  </li>
                ))}
              </ul>
            </Reveal>
          ) : null}

          {event.trailerVideo ? (
            <Reveal delay={0.08} className="mt-14">
              <h2 className="u-display text-[length:var(--text-title)]">
                {event.isPast ? (
                  <>
                    How it <Script>sounded</Script>
                  </>
                ) : (
                  <>
                    Last <Script>time</Script>
                  </>
                )}
              </h2>
              <FeatureVideo
                src={event.trailerVideo}
                poster={event.trailerPoster}
                title={event.title}
                className="mt-6 aspect-[4/3] w-full bg-ink"
              />
            </Reveal>
          ) : null}

          {event.gallery?.length > 0 ? (
            <Reveal delay={0.08} className="mt-14">
              <h2 className="u-display text-[length:var(--text-title)]">
                From the <Script>archive</Script>
              </h2>
              <div className="mt-8 grid grid-cols-2 gap-3 md:grid-cols-4">
                {event.gallery.map((image, index) => (
                  <div key={index} className="aspect-square overflow-hidden bg-ink-soft">
                    <img
                      src={image}
                      alt=""
                      loading="lazy"
                      className="size-full object-cover transition-transform duration-[1.1s] hover:scale-105"
                    />
                  </div>
                ))}
              </div>
            </Reveal>
          ) : null}

          {event.tags?.length > 0 ? (
            <div className="mt-14 flex flex-wrap gap-2">
              {event.tags.map((tag) => (
                <span
                  key={tag}
                  className="border border-ink-line px-3 py-1.5 font-sans text-[0.625rem] uppercase tracking-[0.18em] text-ivory-faint"
                >
                  {tag}
                </span>
              ))}
            </div>
          ) : null}
        </div>

        {/* Sticky ticket rail */}
        <aside className="lg:sticky lg:top-28 lg:self-start">
          <div className="surface p-7">
            <p className="u-eyebrow">Tickets</p>

            {event.isPast ? (
              <>
                <p className="mt-4 font-display text-2xl">This evening has passed</p>
                <p className="mt-2 text-sm text-ivory-dim">
                  Photographs from the night are in the gallery.
                </p>
                <Link to="/gallery" className="btn btn-ghost mt-6 w-full">
                  Open the gallery
                </Link>
              </>
            ) : (
              <>
                <p className="mt-4 font-display text-4xl font-bold">
                  From {formatPrice(event.lowestPrice)}
                </p>

                <ul className="mt-7 space-y-3 border-t border-ink-line pt-6">
                  {event.ticketTypes.map((tier) => (
                    <li key={tier.id} className="flex items-baseline justify-between gap-4">
                      <div className="min-w-0">
                        <p className="truncate text-sm text-ivory">{tier.name}</p>
                      </div>
                      <p className="shrink-0 font-display text-lg tabular-nums text-gold-lift">
                        {formatPrice(tier.price)}
                      </p>
                    </li>
                  ))}
                </ul>

                <button
                  type="button"
                  className="btn btn-buy mt-7 w-full"
                  disabled={!canBuy}
                  onClick={() => setIsBuying(true)}
                >
                  <Ticket size={15} strokeWidth={1.5} />
                  {canBuy ? 'Buy tickets' : 'Not yet on sale'}
                </button>

                <p className="mt-4 text-center text-xs text-ivory-faint">
                  Secure checkout by Paystack
                </p>
              </>
            )}
          </div>
        </aside>
      </div>

      <TicketDialog open={isBuying} onClose={() => setIsBuying(false)} event={event} />
    </>
  )
}
