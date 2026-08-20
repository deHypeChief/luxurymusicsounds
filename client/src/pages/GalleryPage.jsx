import { ImageOff } from 'lucide-react'
import { useMemo, useState } from 'react'
import GalleryCanvas from '../components/GalleryCanvas'
import Lightbox from '../components/Lightbox'
import Reveal from '../components/Reveal'
import { EmptyState, ErrorState, Spinner } from '../components/States'
import { Script } from '../components/Typography'
import { useApi } from '../hooks/useApi'
import { useDocumentTitle } from '../hooks/useDocumentTitle'
import { publicApi } from '../lib/api'

export default function GalleryPage() {
  useDocumentTitle('Gallery')

  const [category, setCategory] = useState('all')
  const [openIndex, setOpenIndex] = useState(null)

  const { data, error, isLoading, reload } = useApi(() => publicApi.gallery({ limit: 200 }), [])

  const items = useMemo(() => data?.items ?? [], [data])

  const filters = useMemo(() => {
    const counts = new Map()
    for (const item of items) {
      counts.set(item.category, (counts.get(item.category) ?? 0) + 1)
    }

    return [
      { value: 'all', label: 'Everything', count: items.length },
      ...[...counts.entries()]
        .sort((a, b) => b[1] - a[1])
        .map(([value, count]) => ({ value, label: value, count })),
    ]
  }, [items])

  const visible = useMemo(
    () => (category === 'all' ? items : items.filter((item) => item.category === category)),
    [items, category],
  )

  return (
    <>
      <header className="pb-8 pt-32 md:pt-40">
        <div className="shell">
          <Reveal>
            <p className="u-eyebrow">The archive</p>
            <h1 className="u-display mt-4 text-[length:var(--text-display)]">
              What it <Script xl>looked</Script> like
            </h1>
          </Reveal>

          {filters.length > 1 ? (
            <Reveal delay={0.08}>
              <div
                className="no-scrollbar mt-8 flex gap-2 overflow-x-auto pb-1"
                role="group"
                aria-label="Filter gallery"
              >
                {filters.map((filter) => {
                  const isActive = filter.value === category
                  return (
                    <button
                      key={filter.value}
                      type="button"
                      onClick={() => {
                        setCategory(filter.value)
                        setOpenIndex(null)
                      }}
                      aria-pressed={isActive}
                      className={`shrink-0 whitespace-nowrap border px-4 py-2 font-sans text-[0.6875rem] font-medium uppercase tracking-[0.18em] transition-colors duration-300 ${
                        isActive
                          ? 'border-gold-lift bg-gold-lift text-ink'
                          : 'border-ink-line text-ivory-dim hover:border-gold-deep hover:text-gold-lift'
                      }`}
                    >
                      {filter.label}
                      <span className="ml-2 opacity-60">{filter.count}</span>
                    </button>
                  )
                })}
              </div>
            </Reveal>
          ) : null}
        </div>
      </header>

      <div className="pb-16">
        {isLoading ? (
          <Spinner label="Loading the archive" />
        ) : error ? (
          <div className="shell">
            <ErrorState error={error} onRetry={reload} />
          </div>
        ) : visible.length === 0 ? (
          <div className="shell">
            <EmptyState
              icon={ImageOff}
              title="Nothing here yet"
              description="Photographs are added after each evening."
            />
          </div>
        ) : (
          <GalleryCanvas items={visible} onOpen={setOpenIndex} />
        )}
      </div>

      <Lightbox
        items={visible}
        index={openIndex}
        onClose={() => setOpenIndex(null)}
        onStep={setOpenIndex}
      />
    </>
  )
}
