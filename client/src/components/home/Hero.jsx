import { motion } from 'framer-motion'
import { ArrowDown, Ticket } from 'lucide-react'
import { Link } from 'react-router-dom'
import { usePrefersReducedMotion } from '../../hooks/useApi'
import { formatDate, formatTime } from '../../lib/format'
import { BRAND_MEDIA } from '../../lib/site'
import { BackgroundVideo } from '../VideoPlayer'
import { Script } from '../Typography'

/**
 * The client's own photograph of a Four Seasons audience. An audience, rather
 * than performers, is the right image under this headline, the room going
 * quiet is what the whole page is about.
 */
const FALLBACK_IMAGE = '/media/four-seasons/audience-full-house.jpg'

/**
 * The hero is the thesis: the second before the first note. Everything about a
 * live-music house happens in that gap, so the headline names it rather than
 * listing services.
 */
export default function Hero({ event, onBuy }) {
  const reducedMotion = usePrefersReducedMotion()

  const rise = (delay) =>
    reducedMotion
      ? {}
      : {
          initial: { opacity: 0, y: 34 },
          animate: { opacity: 1, y: 0 },
          transition: { duration: 1, delay, ease: [0.16, 1, 0.3, 1] },
        }

  return (
    <section className="relative grain min-h-[100svh] overflow-hidden">
      <div className="absolute inset-0">
        {/* The still is the content; the loop is an enhancement over it. */}
        <BackgroundVideo
          src={BRAND_MEDIA.heroVideo}
          poster={event?.heroImage || BRAND_MEDIA.heroPoster || FALLBACK_IMAGE}
          imageClassName={reducedMotion ? '' : 'drift'}
        />
        <div className="scrim absolute inset-0" />
      </div>

      <div className="shell relative flex min-h-[100svh] flex-col justify-end pb-12 pt-32 md:pb-16">
        <motion.p className="u-eyebrow" {...rise(0.15)}>
          Lagos · Live strings · Est. 2016
        </motion.p>

        <motion.h1
          className="u-display mt-6 text-[length:var(--text-hero)]"
          {...rise(0.28)}
        >
          The room
          <br />
          goes <Script xl>quiet</Script>
          <br />
          first
        </motion.h1>

        <motion.div
          className="mt-10 grid gap-10 lg:grid-cols-[1.05fr_auto] lg:items-end"
          {...rise(0.45)}
        >
          <p className="max-w-xl text-lg leading-relaxed text-ivory-dim">
            A live-music house in Lagos. Solo violin as{' '}
            <span className="text-ivory">Easystrings</span>, a full string section as{' '}
            <span className="text-ivory">The Four Seasons</span>, and the black-tie evenings
            where both share a stage.
          </p>

          <div className="flex flex-wrap gap-3">
            <Link to="/events" className="btn btn-solid">
              See what&rsquo;s on
            </Link>
            {event && onBuy ? (
              <button type="button" onClick={() => onBuy(event)} className="btn btn-buy">
                <Ticket size={15} strokeWidth={1.5} />
                Book tickets
              </button>
            ) : (
              <Link to="/about" className="btn btn-ghost">
                Meet the house
              </Link>
            )}
          </div>
        </motion.div>

        {/* Next-date rail: the one piece of hard information a visitor wants. */}
        <motion.div
          className="mt-12 flex flex-col gap-4 border-t border-ivory/12 pt-6 sm:flex-row sm:items-center sm:justify-between"
          {...rise(0.6)}
        >
          {event ? (
            <div className="flex items-center gap-4">
              <span className="relative flex size-2 shrink-0">
                <span className="absolute inline-flex size-full animate-ping rounded-full bg-velvet-lift opacity-75" />
                <span className="relative inline-flex size-2 rounded-full bg-velvet-lift" />
              </span>
              <p className="text-sm text-ivory-dim">
                <span className="u-meta mr-3">Next</span>
                <Link
                  to={`/events/${event.slug}`}
                  className="text-ivory transition-colors hover:text-gold-lift"
                >
                  {event.title}
                </Link>
                <span className="ml-3 text-ivory-faint">
                  {formatDate(event.startsAt, { year: undefined })} ·{' '}
                  {formatTime(event.startsAt)}
                </span>
              </p>
            </div>
          ) : (
            <p className="u-meta">Dates for the new season are being confirmed</p>
          )}

          <a
            href="#programme"
            className="group flex items-center gap-2 text-ivory-faint transition-colors hover:text-gold-lift"
          >
            <span className="u-meta">Programme</span>
            <ArrowDown
              size={14}
              strokeWidth={1.5}
              className="transition-transform duration-500 group-hover:translate-y-1"
            />
          </a>
        </motion.div>
      </div>
    </section>
  )
}
