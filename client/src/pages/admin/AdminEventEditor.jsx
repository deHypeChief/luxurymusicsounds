import { ArrowLeft, Check, Loader2, Plus, Save, Trash2, X } from 'lucide-react'
import { useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import ImageUploader from '../../components/admin/ImageUploader'
import { ErrorState, Spinner } from '../../components/States'
import { useDocumentTitle } from '../../hooks/useDocumentTitle'
import { adminApi } from '../../lib/api'
import { BRANDS, formatDate, formatMoney, formatTime, toDateTimeLocal } from '../../lib/format'
import TicketTiers from './partials/TicketTiers'
import EventAudience from './partials/EventAudience'

const BLANK = {
  title: '',
  tagline: '',
  description: '',
  brand: 'Luxury Music Sounds',
  accent: 'gold',
  heroImage: '',
  posterImage: '',
  trailerVideo: '',
  trailerPoster: '',
  gallery: [],
  venue: { name: '', address: '', city: 'Lagos', country: 'Nigeria' },
  startsAt: '',
  endsAt: '',
  doorsOpenAt: '',
  status: 'draft',
  isHeadline: false,
  showPopup: true,
  sortOrder: 0,
  lineup: [],
  tags: [],
}

const TABS = [
  { id: 'details', label: 'Details' },
  { id: 'tickets', label: 'Ticket tiers' },
  { id: 'audience', label: 'Orders & attendees' },
]

export default function AdminEventEditor() {
  const { id } = useParams()
  const navigate = useNavigate()
  const isNew = !id

  const [form, setForm] = useState(BLANK)
  const [previews, setPreviews] = useState({ hero: '', poster: '', trailerPoster: '' })
  const [event, setEvent] = useState(null)
  const [tab, setTab] = useState('details')

  const [isLoading, setIsLoading] = useState(!isNew)
  const [loadError, setLoadError] = useState(null)
  const [isSaving, setIsSaving] = useState(false)
  const [saveError, setSaveError] = useState(null)
  const [fieldErrors, setFieldErrors] = useState({})
  const [justSaved, setJustSaved] = useState(false)

  useDocumentTitle(isNew ? 'New event · Admin' : form.title ? `${form.title} · Admin` : null)

  const loadEvent = () => {
    if (isNew) return

    setIsLoading(true)
    adminApi
      .event(id)
      .then((data) => {
        setEvent(data)
        setForm({
          title: data.title,
          tagline: data.tagline,
          description: data.description,
          brand: data.brand,
          accent: data.accent,
          heroImage: data.heroImageId ?? '',
          posterImage: data.posterImageId ?? '',
          trailerVideo: data.trailerVideoId ?? '',
          trailerPoster: data.trailerPosterId ?? '',
          gallery: data.galleryIds ?? [],
          venue: {
            name: data.venue?.name ?? '',
            address: data.venue?.address ?? '',
            city: data.venue?.city ?? '',
            country: data.venue?.country ?? 'Nigeria',
          },
          startsAt: toDateTimeLocal(data.startsAt),
          endsAt: toDateTimeLocal(data.endsAt),
          doorsOpenAt: toDateTimeLocal(data.doorsOpenAt),
          status: data.status,
          isHeadline: data.isHeadline,
          showPopup: data.showPopup,
          sortOrder: data.sortOrder ?? 0,
          lineup: data.lineup ?? [],
          tags: data.tags ?? [],
        })
        setPreviews({
          hero: data.heroImage,
          poster: data.posterImage,
          trailerPoster: data.trailerPoster,
        })
        setLoadError(null)
      })
      .catch(setLoadError)
      .finally(() => setIsLoading(false))
  }

  useEffect(loadEvent, [id, isNew])

  const update = (patch) => {
    setForm((current) => ({ ...current, ...patch }))
    setJustSaved(false)
  }

  const handleSave = async (submitEvent) => {
    submitEvent.preventDefault()
    setIsSaving(true)
    setSaveError(null)
    setFieldErrors({})

    // Empty datetime-local values must go over as null, not "".
    const payload = {
      ...form,
      startsAt: form.startsAt || undefined,
      endsAt: form.endsAt || null,
      doorsOpenAt: form.doorsOpenAt || null,
      sortOrder: Number(form.sortOrder) || 0,
      lineup: form.lineup.filter((artist) => artist.name.trim()),
      tags: form.tags.filter(Boolean),
    }

    try {
      if (isNew) {
        const created = await adminApi.createEvent(payload)
        navigate(`/admin/events/${created.id}`, { replace: true })
      } else {
        const updated = await adminApi.updateEvent(id, payload)
        setEvent(updated)
        setJustSaved(true)
        setTimeout(() => setJustSaved(false), 2600)
      }
    } catch (caught) {
      setSaveError(caught.message)
      setFieldErrors(caught.fieldErrors ?? {})
    } finally {
      setIsSaving(false)
    }
  }

  if (isLoading) return <Spinner label="Loading event" />
  if (loadError) return <ErrorState error={loadError} onRetry={loadEvent} />

  return (
    <>
      <header className="mb-8 border-b border-ink-line pb-6">
        <Link
          to="/admin/events"
          className="group mb-5 flex w-fit items-center gap-2 text-ivory-dim transition-colors hover:text-gold-lift"
        >
          <ArrowLeft
            size={15}
            strokeWidth={1.5}
            className="transition-transform duration-500 group-hover:-translate-x-1"
          />
          <span className="u-meta">All events</span>
        </Link>

        <div className="flex flex-wrap items-end justify-between gap-5">
          <div className="min-w-0">
            <h1 className="u-display truncate text-3xl md:text-4xl">
              {isNew ? 'New event' : form.title || 'Untitled event'}
            </h1>
            {!isNew && event ? (
              <p className="mt-2 text-sm text-ivory-dim">
                {formatDate(event.startsAt)} · {formatTime(event.startsAt)} ·{' '}
                {event.totalSold}/{event.totalCapacity} sold ·{' '}
                {formatMoney(event.grossRevenue)}
              </p>
            ) : (
              <p className="mt-2 text-sm text-ivory-dim">
                Fill in the details and save. Ticket tiers come next.
              </p>
            )}
          </div>

          {!isNew ? (
            <a
              href={`/events/${event?.slug}`}
              target="_blank"
              rel="noopener noreferrer"
              className="btn btn-ghost btn-sm"
            >
              Preview on the site
            </a>
          ) : null}
        </div>
      </header>

      {!isNew ? (
        <div className="mb-8 flex gap-1 border-b border-ink-line" role="tablist">
          {TABS.map((item) => (
            <button
              key={item.id}
              type="button"
              role="tab"
              aria-selected={tab === item.id}
              onClick={() => setTab(item.id)}
              className={`-mb-px border-b-2 px-5 py-3 font-sans text-xs uppercase tracking-[0.16em] transition-colors ${
                tab === item.id
                  ? 'border-gold-lift text-gold-lift'
                  : 'border-transparent text-ivory-dim hover:text-ivory'
              }`}
            >
              {item.label}
            </button>
          ))}
        </div>
      ) : null}

      {tab === 'details' || isNew ? (
        <form onSubmit={handleSave} className="grid gap-8 lg:grid-cols-[1.6fr_1fr]">
          <div className="space-y-6">
            <section className="surface p-6">
              <h2 className="mb-5 font-display text-xl font-semibold">The basics</h2>

              <div className="space-y-4">
                <div>
                  <label className="field-label" htmlFor="event-title">
                    Title
                  </label>
                  <input
                    id="event-title"
                    className="field"
                    value={form.title}
                    onChange={(changeEvent) => update({ title: changeEvent.target.value })}
                    placeholder="A Night of Strings"
                    required
                  />
                  {fieldErrors.title ? (
                    <p className="mt-1.5 text-xs text-velvet-lift">{fieldErrors.title}</p>
                  ) : null}
                </div>

                <div>
                  <label className="field-label" htmlFor="event-tagline">
                    Tagline
                  </label>
                  <input
                    id="event-tagline"
                    className="field"
                    value={form.tagline}
                    onChange={(changeEvent) => update({ tagline: changeEvent.target.value })}
                    placeholder="Vivaldi reimagined under candlelight"
                  />
                  <p className="mt-1.5 text-xs text-ivory-faint">
                    One line, shown under the title on the event page.
                  </p>
                </div>

                <div>
                  <label className="field-label" htmlFor="event-description">
                    Description
                  </label>
                  <textarea
                    id="event-description"
                    className="field min-h-44 resize-y"
                    value={form.description}
                    onChange={(changeEvent) => update({ description: changeEvent.target.value })}
                    placeholder="What the evening is, who is playing, what to expect."
                  />
                  <p className="mt-1.5 text-xs text-ivory-faint">
                    Leave a blank line between paragraphs.
                  </p>
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <label className="field-label" htmlFor="event-brand">
                      Act
                    </label>
                    <select
                      id="event-brand"
                      className="field"
                      value={form.brand}
                      onChange={(changeEvent) => update({ brand: changeEvent.target.value })}
                    >
                      {BRANDS.map((brand) => (
                        <option key={brand} value={brand}>
                          {brand}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="field-label" htmlFor="event-accent">
                      Card colour
                    </label>
                    <select
                      id="event-accent"
                      className="field"
                      value={form.accent}
                      onChange={(changeEvent) => update({ accent: changeEvent.target.value })}
                    >
                      <option value="gold">Gold</option>
                      <option value="royal">Royal blue</option>
                      <option value="velvet">Velvet red</option>
                    </select>
                  </div>
                </div>
              </div>
            </section>

            <section className="surface p-6">
              <h2 className="mb-5 font-display text-xl font-semibold">When</h2>

              <div className="grid gap-4 sm:grid-cols-3">
                <div>
                  <label className="field-label" htmlFor="event-starts">
                    Starts
                  </label>
                  <input
                    id="event-starts"
                    type="datetime-local"
                    className="field"
                    value={form.startsAt}
                    onChange={(changeEvent) => update({ startsAt: changeEvent.target.value })}
                    required
                  />
                  {fieldErrors.startsAt ? (
                    <p className="mt-1.5 text-xs text-velvet-lift">{fieldErrors.startsAt}</p>
                  ) : null}
                </div>

                <div>
                  <label className="field-label" htmlFor="event-ends">
                    Ends
                  </label>
                  <input
                    id="event-ends"
                    type="datetime-local"
                    className="field"
                    value={form.endsAt}
                    onChange={(changeEvent) => update({ endsAt: changeEvent.target.value })}
                  />
                </div>

                <div>
                  <label className="field-label" htmlFor="event-doors">
                    Doors open
                  </label>
                  <input
                    id="event-doors"
                    type="datetime-local"
                    className="field"
                    value={form.doorsOpenAt}
                    onChange={(changeEvent) => update({ doorsOpenAt: changeEvent.target.value })}
                  />
                </div>
              </div>
            </section>

            <section className="surface p-6">
              <h2 className="mb-5 font-display text-xl font-semibold">Where</h2>

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="sm:col-span-2">
                  <label className="field-label" htmlFor="venue-name">
                    Venue
                  </label>
                  <input
                    id="venue-name"
                    className="field"
                    value={form.venue.name}
                    onChange={(changeEvent) =>
                      update({ venue: { ...form.venue, name: changeEvent.target.value } })
                    }
                    placeholder="Eko Convention Centre"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="field-label" htmlFor="venue-address">
                    Address
                  </label>
                  <input
                    id="venue-address"
                    className="field"
                    value={form.venue.address}
                    onChange={(changeEvent) =>
                      update({ venue: { ...form.venue, address: changeEvent.target.value } })
                    }
                  />
                </div>

                <div>
                  <label className="field-label" htmlFor="venue-city">
                    City
                  </label>
                  <input
                    id="venue-city"
                    className="field"
                    value={form.venue.city}
                    onChange={(changeEvent) =>
                      update({ venue: { ...form.venue, city: changeEvent.target.value } })
                    }
                  />
                </div>

                <div>
                  <label className="field-label" htmlFor="venue-country">
                    Country
                  </label>
                  <input
                    id="venue-country"
                    className="field"
                    value={form.venue.country}
                    onChange={(changeEvent) =>
                      update({ venue: { ...form.venue, country: changeEvent.target.value } })
                    }
                  />
                </div>
              </div>
            </section>

            <LineupEditor
              lineup={form.lineup}
              onChange={(lineup) => update({ lineup })}
            />
          </div>

          {/* Sidebar */}
          <div className="space-y-6 lg:sticky lg:top-6 lg:self-start">
            <section className="surface p-6">
              <h2 className="mb-5 font-display text-xl font-semibold">Publishing</h2>

              <div className="space-y-4">
                <div>
                  <label className="field-label" htmlFor="event-status">
                    Status
                  </label>
                  <select
                    id="event-status"
                    className="field"
                    value={form.status}
                    onChange={(changeEvent) => update({ status: changeEvent.target.value })}
                  >
                    <option value="draft">Draft, hidden from the site</option>
                    <option value="published">Published, live and sellable</option>
                    <option value="archived">Archived, records kept</option>
                  </select>
                </div>

                <label className="flex cursor-pointer items-start gap-3 border border-ink-line p-4">
                  <input
                    type="checkbox"
                    className="mt-1 accent-[#7A1C2B]"
                    checked={form.isHeadline}
                    onChange={(changeEvent) => update({ isHeadline: changeEvent.target.checked })}
                  />
                  <span>
                    <span className="block text-sm text-ivory">Headline (special) event</span>
                    <span className="mt-1 block text-xs text-ivory-faint">
                      Takes the featured slot on the home page. Setting this removes it from any
                      other event.
                    </span>
                  </span>
                </label>

                <label
                  className={`flex cursor-pointer items-start gap-3 border border-ink-line p-4 ${
                    form.isHeadline ? '' : 'opacity-50'
                  }`}
                >
                  <input
                    type="checkbox"
                    className="mt-1 accent-[#7A1C2B]"
                    checked={form.showPopup}
                    disabled={!form.isHeadline}
                    onChange={(changeEvent) => update({ showPopup: changeEvent.target.checked })}
                  />
                  <span>
                    <span className="block text-sm text-ivory">Open the buy dialog</span>
                    <span className="mt-1 block text-xs text-ivory-faint">
                      Shows the ticket dialog to first-time visitors, once per session.
                    </span>
                  </span>
                </label>

                <div>
                  <label className="field-label" htmlFor="event-sort">
                    Priority
                  </label>
                  <input
                    id="event-sort"
                    type="number"
                    className="field"
                    value={form.sortOrder}
                    onChange={(changeEvent) => update({ sortOrder: changeEvent.target.value })}
                  />
                  <p className="mt-1.5 text-xs text-ivory-faint">
                    Higher numbers sort first in listings.
                  </p>
                </div>
              </div>
            </section>

            <section className="surface space-y-5 p-6">
              <h2 className="font-display text-xl font-semibold">Images</h2>

              <ImageUploader
                label="Hero image"
                value={form.heroImage}
                preview={previews.hero}
                onChange={(value, url) => {
                  update({ heroImage: value })
                  setPreviews((current) => ({ ...current, hero: url }))
                }}
                hint="Full-bleed, landscape. Used at the top of the event page."
                aspect="aspect-[16/9]"
              />

              <ImageUploader
                label="Poster image"
                value={form.posterImage}
                preview={previews.poster}
                onChange={(value, url) => {
                  update({ posterImage: value })
                  setPreviews((current) => ({ ...current, poster: url }))
                }}
                hint="Portrait or square. Used on cards and in the buy dialog."
                aspect="aspect-[3/4]"
              />
            </section>

            <section className="surface space-y-4 p-6">
              <h2 className="font-display text-xl font-semibold">Trailer</h2>
              <p className="-mt-2 text-xs text-ivory-faint">
                A highlight reel from a previous edition, shown on the event page next to
                Buy tickets. Leave both empty and the section is hidden.
              </p>

              <div>
                <label className="field-label" htmlFor="event-trailer">
                  Video file
                </label>
                <input
                  id="event-trailer"
                  className="field"
                  value={form.trailerVideo}
                  onChange={(changeEvent) => update({ trailerVideo: changeEvent.target.value })}
                  placeholder="/media/four-seasons/trailer.mp4"
                />
                <p className="mt-1.5 text-xs text-ivory-faint">
                  A path under client/public/media/, or a full URL. MP4 only.
                </p>
              </div>

              <ImageUploader
                label="Trailer poster"
                value={form.trailerPoster}
                preview={previews.trailerPoster}
                onChange={(value, url) => {
                  update({ trailerPoster: value })
                  setPreviews((current) => ({ ...current, trailerPoster: url }))
                }}
                hint="The still shown before anyone presses play. Falls back to the hero image."
                aspect="aspect-video"
              />
            </section>

            <TagEditor tags={form.tags} onChange={(tags) => update({ tags })} />

            <div className="surface p-6">
              {saveError ? (
                <p
                  role="alert"
                  className="mb-4 border border-velvet/50 bg-velvet-deep/25 p-3 text-sm"
                >
                  {saveError}
                </p>
              ) : null}

              <button type="submit" className="btn btn-buy w-full" disabled={isSaving}>
                {isSaving ? (
                  <>
                    <Loader2 size={15} strokeWidth={1.5} className="animate-spin" />
                    Saving
                  </>
                ) : justSaved ? (
                  <>
                    <Check size={15} strokeWidth={1.5} />
                    Saved
                  </>
                ) : (
                  <>
                    <Save size={15} strokeWidth={1.5} />
                    {isNew ? 'Create event' : 'Save changes'}
                  </>
                )}
              </button>

              {isNew ? (
                <p className="mt-3 text-center text-xs text-ivory-faint">
                  You can add ticket tiers once the event exists.
                </p>
              ) : null}
            </div>
          </div>
        </form>
      ) : null}

      {tab === 'tickets' && !isNew ? (
        <TicketTiers event={event} onChanged={setEvent} />
      ) : null}

      {tab === 'audience' && !isNew ? <EventAudience eventId={id} /> : null}
    </>
  )
}

/** Free-form tags, entered one at a time. */
function TagEditor({ tags, onChange }) {
  const [draft, setDraft] = useState('')

  const add = () => {
    const value = draft.trim()
    if (!value || tags.includes(value)) {
      setDraft('')
      return
    }
    onChange([...tags, value])
    setDraft('')
  }

  return (
    <section className="surface p-6">
      <h2 className="mb-4 font-display text-xl font-semibold">Tags</h2>

      <div className="flex gap-2">
        <input
          className="field"
          value={draft}
          placeholder="Black tie"
          onChange={(event) => setDraft(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === 'Enter') {
              event.preventDefault()
              add()
            }
          }}
          aria-label="New tag"
        />
        <button type="button" onClick={add} className="btn btn-gold btn-sm shrink-0">
          Add
        </button>
      </div>

      {tags.length > 0 ? (
        <ul className="mt-4 flex flex-wrap gap-2">
          {tags.map((tag) => (
            <li
              key={tag}
              className="flex items-center gap-2 border border-ink-line px-3 py-1.5 text-xs text-ivory-dim"
            >
              {tag}
              <button
                type="button"
                onClick={() => onChange(tags.filter((item) => item !== tag))}
                className="text-ivory-faint transition-colors hover:text-velvet-lift"
                aria-label={`Remove tag ${tag}`}
              >
                <X size={12} strokeWidth={2} />
              </button>
            </li>
          ))}
        </ul>
      ) : null}
    </section>
  )
}

function LineupEditor({ lineup, onChange }) {
  const updateAt = (index, patch) => {
    onChange(lineup.map((artist, position) => (position === index ? { ...artist, ...patch } : artist)))
  }

  return (
    <section className="surface p-6">
      <div className="mb-5 flex items-center justify-between">
        <h2 className="font-display text-xl font-semibold">Who is playing</h2>
        <button
          type="button"
          onClick={() => onChange([...lineup, { name: '', role: '', image: '' }])}
          className="btn btn-gold btn-sm"
        >
          <Plus size={13} strokeWidth={1.5} />
          Add
        </button>
      </div>

      {lineup.length === 0 ? (
        <p className="text-sm text-ivory-faint">
          No performers listed. The lineup section is hidden on the event page until you add one.
        </p>
      ) : (
        <ul className="space-y-3">
          {lineup.map((artist, index) => (
            <li key={index} className="grid gap-3 border border-ink-line p-4 sm:grid-cols-2">
              <input
                className="field"
                value={artist.name}
                placeholder="Name"
                onChange={(event) => updateAt(index, { name: event.target.value })}
                aria-label={`Performer ${index + 1} name`}
              />
              <input
                className="field"
                value={artist.role}
                placeholder="Role, e.g. Lead violin"
                onChange={(event) => updateAt(index, { role: event.target.value })}
                aria-label={`Performer ${index + 1} role`}
              />
              <div className="flex gap-2 sm:col-span-2">
                <input
                  className="field"
                  value={artist.image}
                  placeholder="Image URL or Cloudflare id (optional)"
                  onChange={(event) => updateAt(index, { image: event.target.value })}
                  aria-label={`Performer ${index + 1} image`}
                />
                <button
                  type="button"
                  onClick={() => onChange(lineup.filter((_, position) => position !== index))}
                  className="grid size-11 shrink-0 place-items-center border border-ink-line text-ivory-dim transition-colors hover:border-velvet hover:text-velvet-lift"
                  aria-label={`Remove performer ${index + 1}`}
                >
                  <Trash2 size={14} strokeWidth={1.5} />
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </section>
  )
}
