import { CalendarX } from 'lucide-react'
import { useState } from 'react'
import EventCard from '../components/EventCard'
import Reveal from '../components/Reveal'
import { EmptyState, ErrorState, SkeletonCard } from '../components/States'
import TicketDialog from '../components/TicketDialog'
import { Script } from '../components/Typography'
import { useApi } from '../hooks/useApi'
import { useDocumentTitle } from '../hooks/useDocumentTitle'
import { publicApi } from '../lib/api'
import { BRANDS } from '../lib/format'

const SCOPES = [
  { value: 'upcoming', label: 'Upcoming' },
  { value: 'past', label: 'Past' },
]

export default function Events() {
  useDocumentTitle('Events')

  const [scope, setScope] = useState('upcoming')
  const [brand, setBrand] = useState('all')
  const [buying, setBuying] = useState(null)

  const { data, error, isLoading, reload } = useApi(
    () => publicApi.events({ scope, brand: brand === 'all' ? undefined : brand, limit: 48 }),
    [scope, brand],
  )

  const events = data ?? []

  return (
    <>
      <header className="wash-royal pb-16 pt-36 md:pb-20 md:pt-44">
        <div className="shell">
          <Reveal>
            <p className="u-eyebrow">The diary</p>
            <h1 className="u-display mt-5 text-[length:var(--text-hero)]">
              Every <Script xl>date</Script>
            </h1>
            <p className="mt-8 max-w-xl text-lg text-ivory-dim">
              Concert programmes, intimate sessions and black-tie evenings across Lagos.
              Tickets are sold here and nowhere else.
            </p>
          </Reveal>
        </div>
      </header>

      <div className="shell pb-24 pt-12">
        <Reveal className="mb-12 flex flex-wrap items-center justify-between gap-6 border-b border-ink-line pb-6">
          <div className="flex gap-2" role="group" aria-label="Filter by date">
            {SCOPES.map((option) => (
              <button
                key={option.value}
                type="button"
                onClick={() => setScope(option.value)}
                aria-pressed={scope === option.value}
                className={`border px-4 py-2 font-sans text-[0.6875rem] font-medium uppercase tracking-[0.18em] transition-colors duration-300 ${
                  scope === option.value
                    ? 'border-gold-lift bg-gold-lift text-ink'
                    : 'border-ink-line text-ivory-dim hover:border-gold-deep hover:text-gold-lift'
                }`}
              >
                {option.label}
              </button>
            ))}
          </div>

          <div className="no-scrollbar flex gap-2 overflow-x-auto" role="group" aria-label="Filter by act">
            {['all', ...BRANDS].map((option) => (
              <button
                key={option}
                type="button"
                onClick={() => setBrand(option)}
                aria-pressed={brand === option}
                className={`shrink-0 whitespace-nowrap border px-4 py-2 font-sans text-[0.6875rem] font-medium uppercase tracking-[0.18em] transition-colors duration-300 ${
                  brand === option
                    ? 'border-ivory bg-ivory text-ink'
                    : 'border-ink-line text-ivory-dim hover:border-gold-deep hover:text-gold-lift'
                }`}
              >
                {option === 'all' ? 'All acts' : option}
              </button>
            ))}
          </div>
        </Reveal>

        {error ? (
          <ErrorState error={error} onRetry={reload} />
        ) : (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {isLoading ? (
              [0, 1, 2, 3, 4, 5].map((key) => <SkeletonCard key={key} />)
            ) : events.length > 0 ? (
              events.map((event, index) => (
                <Reveal key={event.id} delay={Math.min(index, 5) * 0.05} className="h-full">
                  <EventCard event={event} onBuy={setBuying} priority={index < 3} />
                </Reveal>
              ))
            ) : (
              <EmptyState
                className="sm:col-span-2 lg:col-span-3"
                icon={CalendarX}
                title={scope === 'past' ? 'No past events here' : 'No dates announced yet'}
                description={
                  brand === 'all'
                    ? 'The next season is being confirmed. Check back shortly.'
                    : `Nothing from ${brand} in this window. Try another act.`
                }
                action={
                  brand !== 'all' ? (
                    <button
                      type="button"
                      className="btn btn-gold btn-sm"
                      onClick={() => setBrand('all')}
                    >
                      Show all acts
                    </button>
                  ) : null
                }
              />
            )}
          </div>
        )}
      </div>

      <TicketDialog open={Boolean(buying)} onClose={() => setBuying(null)} event={buying} />
    </>
  )
}
