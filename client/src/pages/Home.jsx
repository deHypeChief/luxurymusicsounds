import { ArrowRight, ArrowUpRight, CalendarX, Ticket } from 'lucide-react'
import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import Dialog from '../components/Dialog'
import EventCard from '../components/EventCard'
import Reveal from '../components/Reveal'
import { EmptyState } from '../components/States'
import TicketDialog from '../components/TicketDialog'
import { Movement, Script } from '../components/Typography'
import { headlineEvent, publishedEvents } from '../content/events'
import Chapters from '../components/home/Chapters'
import Hero from '../components/home/Hero'
import MediaMarquee from '../components/home/MediaMarquee'
import HeadlineEvent, { HeadlinePromo } from '../components/home/HeadlineEvent'
import { useDocumentTitle } from '../hooks/useDocumentTitle'
import { BRAND_PROFILES, FOUNDER, socialsFor } from '../content/site'
import { ACCENT_CLASSES } from '../lib/format'

const PROMO_SEEN_KEY = 'lms:special-event-seen'
const PROMO_DELAY_MS = 3500

export default function Home() {
  useDocumentTitle('Luxury Music Sounds')

  const [buying, setBuying] = useState(null)
  const [isPromoOpen, setIsPromoOpen] = useState(false)

  // Everything the page needs is in the repo, so there is nothing to load and
  // no loading state to design around.
  const headline = headlineEvent()
  const upcoming = publishedEvents({ scope: 'upcoming' })

  // Everything on sale, minus the headline that already has its own section.
  const onSale = upcoming.filter(
    (event) => event.ticketsOnSale && event.id !== headline?.id,
  )

  // The special-event dialog opens once per browser session, after a short
  // pause. Interrupting someone the instant the page paints reads as a popup
  // ad; letting the hero land first makes it read as an invitation.
  useEffect(() => {
    if (!headline?.showPopup || !headline.ticketsOnSale) return
    if (sessionStorage.getItem(PROMO_SEEN_KEY) === headline.id) return

    const timer = setTimeout(() => setIsPromoOpen(true), PROMO_DELAY_MS)
    return () => clearTimeout(timer)
  }, [headline])

  const dismissPromo = () => {
    setIsPromoOpen(false)
    if (headline) sessionStorage.setItem(PROMO_SEEN_KEY, headline.id)
  }

  const buyFromPromo = () => {
    dismissPromo()
    setBuying(headline)
  }

  return (
    <>
      <Hero event={headline} onBuy={setBuying} />

      <HeadlineEvent event={headline} onBuy={setBuying} />

      {/* ---- Tickets on sale ------------------------------------------- */}
      <section className="border-t border-ink-line py-20 md:py-28">
        <div className="shell">
          <Reveal>
            <Movement numeral="II" label="On sale now" />
          </Reveal>

          <Reveal delay={0.08} className="mt-10 flex flex-wrap items-end justify-between gap-6">
            <h2 className="u-display max-w-2xl text-[length:var(--text-display)]">
              Tickets you can <Script xl>buy</Script> tonight
            </h2>
            <Link
              to="/events"
              className="group flex items-center gap-2 text-ivory-dim transition-colors hover:text-gold-lift"
            >
              <span className="u-meta">All events</span>
              <ArrowRight
                size={15}
                strokeWidth={1.5}
                className="transition-transform duration-500 group-hover:translate-x-1"
              />
            </Link>
          </Reveal>

          <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {onSale.length > 0 ? (
              onSale.slice(0, 6).map((event, index) => (
                <Reveal key={event.id} delay={index * 0.06} className="h-full">
                  <EventCard event={event} onBuy={setBuying} priority={index < 3} />
                </Reveal>
              ))
            ) : (
              <EmptyState
                className="sm:col-span-2 lg:col-span-3"
                icon={CalendarX}
                title="Nothing on sale right now"
                description="The next season is being confirmed. Follow along and you will hear first."
                action={
                  <Link to="/events" className="btn btn-gold btn-sm">
                    Browse past events
                  </Link>
                }
              />
            )}
          </div>
        </div>
      </section>

      <Chapters />

      {/* ---- The three acts --------------------------------------------- */}
      <section className="border-t border-ink-line wash-velvet py-20 md:py-28">
        <div className="shell">
          <Reveal>
            <Movement numeral="IV" label="The house" />
          </Reveal>

          <Reveal delay={0.08}>
            <h2 className="u-display mt-10 max-w-3xl text-[length:var(--text-display)]">
              Three names, one <Script xl>house</Script>
            </h2>
          </Reveal>

          <div className="mt-14 grid gap-px border border-ink-line bg-ink-line md:grid-cols-3">
            {BRAND_PROFILES.map((brand, index) => {
              const accent = ACCENT_CLASSES[brand.accent]
              return (
                <Reveal
                  key={brand.id}
                  delay={index * 0.08}
                  className="group flex flex-col bg-ink p-8 transition-colors duration-500 hover:bg-ink-raised md:p-10"
                >
                  <span className={`mb-6 block size-2 rounded-full ${accent.dot}`} />
                  <p className="u-eyebrow">{brand.role}</p>
                  <h3 className="mt-3 font-display text-3xl font-bold leading-tight">
                    {brand.name}
                  </h3>
                  <p className="mt-4 flex-1 text-sm leading-relaxed text-ivory-dim">
                    {brand.blurb}
                  </p>

                  <ul className="mt-8 flex flex-wrap gap-x-4 gap-y-2">
                    {socialsFor(brand.name).map((social) => (
                      <li key={social.platform}>
                        <a
                          href={social.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-1 text-xs text-ivory-faint transition-colors hover:text-gold-lift"
                        >
                          {social.platform}
                          <ArrowUpRight size={11} strokeWidth={1.5} />
                        </a>
                      </li>
                    ))}
                  </ul>
                </Reveal>
              )
            })}
          </div>
        </div>
      </section>

      {/* ---- Gallery teaser --------------------------------------------- */}
      <section className="border-t border-ink-line py-20 md:py-28">
        <div className="shell">
          <Reveal>
            <Movement numeral="V" label="From the floor" />
          </Reveal>

          <Reveal delay={0.08} className="mt-10 flex flex-wrap items-end justify-between gap-6">
            <h2 className="u-display max-w-2xl text-[length:var(--text-display)]">
              Photographs from the <Script xl>season</Script>
            </h2>
            <Link
              to="/gallery"
              className="group flex items-center gap-2 text-ivory-dim transition-colors hover:text-gold-lift"
            >
              <span className="u-meta">Open the gallery</span>
              <ArrowRight
                size={15}
                strokeWidth={1.5}
                className="transition-transform duration-500 group-hover:translate-x-1"
              />
            </Link>
          </Reveal>
        </div>

        <Reveal delay={0.12} className="mt-12">
          <MediaMarquee />
        </Reveal>
      </section>

      {/* ---- The intermission: the one ivory section ------------------- */}
      <section className="intermission py-20 md:py-28">
        <div className="shell grid gap-12 lg:grid-cols-[1fr_1.1fr] lg:items-center lg:gap-20">
          <Reveal className="relative">
            <div className="aspect-[4/5] overflow-hidden">
              <img src={FOUNDER.portrait} alt={FOUNDER.name} className="size-full object-cover" />
            </div>
          </Reveal>

          <Reveal delay={0.1}>
            <Movement numeral="VI" label="The founder" />

            <h2 className="u-display mt-8 text-[length:var(--text-display)]">
              It started with one <Script xl>violin</Script>
            </h2>

            <p className="mt-8 text-lg leading-relaxed text-ink/75">{FOUNDER.short}</p>

            <p className="mt-6 text-ink/60">{FOUNDER.paragraphs[1]}</p>

            <div className="mt-10 flex flex-wrap items-center gap-6">
              <Link to="/about" className="btn btn-ghost">
                Read the full story
              </Link>
              <p>
                <span className="u-script text-3xl">{FOUNDER.signature}</span>
                <span className="mt-1 block text-xs uppercase tracking-[0.18em] text-ink/50">
                  {FOUNDER.role}
                </span>
              </p>
            </div>
          </Reveal>
        </div>
      </section>

      {/* ---- Closing call ----------------------------------------------- */}
      <section className="relative overflow-hidden wash-royal py-24 md:py-32">
        <div className="shell text-center">
          <Reveal>
            <h2 className="u-display mx-auto max-w-4xl text-[length:var(--text-display)]">
              Come and hear the <Script xl>difference</Script>
            </h2>
            <p className="mx-auto mt-8 max-w-xl text-lg text-ivory-dim">
              Seats go quickly, and the good ones go first. Pick a date and we will keep one
              for you.
            </p>
            <div className="mt-10 flex flex-wrap justify-center gap-3">
              <Link to="/events" className="btn btn-buy">
                <Ticket size={15} strokeWidth={1.5} />
                Book tickets
              </Link>
              <Link to="/about" className="btn btn-ghost">
                Enquire about a private booking
              </Link>
            </div>
          </Reveal>
        </div>
      </section>

      <TicketDialog open={Boolean(buying)} onClose={() => setBuying(null)} event={buying} />

      <Dialog
        open={isPromoOpen}
        onClose={dismissPromo}
        label={headline ? `Special event: ${headline.title}` : 'Special event'}
        size="lg"
        className="overflow-hidden"
      >
        <HeadlinePromo event={headline} onBuy={buyFromPromo} onDismiss={dismissPromo} />
      </Dialog>
    </>
  )
}
