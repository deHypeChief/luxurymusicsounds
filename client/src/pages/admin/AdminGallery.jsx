import { Check, Eye, EyeOff, Film, ImagePlus, Loader2, Star, Trash2, Upload } from 'lucide-react'
import { useRef, useState } from 'react'
import { AdminHeader } from '../../components/admin/AdminLayout'
import { EmptyState, ErrorState, Spinner } from '../../components/States'
import { useApi } from '../../hooks/useApi'
import { adminApi, uploadImage } from '../../lib/api'
import { BRANDS } from '../../lib/format'

const CATEGORIES = ['Performances', 'Venues', 'Details', 'Galas', 'Portraits', 'Rehearsals']

const VIDEO_PATTERN = /\.(mp4|webm|ogv|mov|m4v)(\?|#|$)/i

/** Saves anyone having to declare what they just pasted. */
const looksLikeVideo = (value) => VIDEO_PATTERN.test(value)

export default function AdminGallery() {
  const [brand, setBrand] = useState('all')
  const [busyId, setBusyId] = useState(null)
  const [error, setError] = useState(null)
  const [uploads, setUploads] = useState({ done: 0, total: 0 })
  const [urlDraft, setUrlDraft] = useState('')

  const inputRef = useRef(null)
  const { data, error: loadError, isLoading, reload } = useApi(
    () => adminApi.gallery({ brand }),
    [brand],
  )

  const items = data ?? []

  const addRecords = async (sources) => {
    await adminApi.createGalleryItems(
      sources.map((image, index) => ({
        image,
        mediaType: looksLikeVideo(image) ? 'video' : 'image',
        brand: brand === 'all' ? 'Luxury Music Sounds' : brand,
        category: 'Performances',
        orientation: 'landscape',
        sortOrder: items.length + index,
      })),
    )
    reload()
  }

  const handleFiles = async (fileList) => {
    const files = [...(fileList ?? [])].filter((file) => file.type.startsWith('image/'))
    if (files.length === 0) return

    setError(null)
    setUploads({ done: 0, total: files.length })

    const uploaded = []
    for (const file of files) {
      try {
        const result = await uploadImage(file, 'gallery')
        uploaded.push(result.imageId)
      } catch (caught) {
        setError(caught.message)
        break
      } finally {
        setUploads((current) => ({ ...current, done: current.done + 1 }))
      }
    }

    if (uploaded.length > 0) {
      try {
        await addRecords(uploaded)
      } catch (caught) {
        setError(caught.message)
      }
    }

    setUploads({ done: 0, total: 0 })
  }

  const addByUrl = async () => {
    const url = urlDraft.trim()
    if (!url) return

    setError(null)
    try {
      await addRecords([url])
      setUrlDraft('')
    } catch (caught) {
      setError(caught.message)
    }
  }

  const patch = async (item, changes) => {
    setBusyId(item.id)
    setError(null)
    try {
      await adminApi.updateGalleryItem(item.id, changes)
      reload()
    } catch (caught) {
      setError(caught.message)
    } finally {
      setBusyId(null)
    }
  }

  const remove = async (item) => {
    if (!window.confirm('Remove this image? It is also deleted from Cloudflare.')) return

    setBusyId(item.id)
    setError(null)
    try {
      await adminApi.deleteGalleryItem(item.id)
      reload()
    } catch (caught) {
      setError(caught.message)
    } finally {
      setBusyId(null)
    }
  }

  const isUploading = uploads.total > 0

  return (
    <>
      <AdminHeader
        title="Gallery"
        description="Photographs shown on the public gallery page."
        action={
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            className="btn btn-buy btn-sm"
            disabled={isUploading}
          >
            {isUploading ? (
              <>
                <Loader2 size={14} strokeWidth={1.5} className="animate-spin" />
                {uploads.done}/{uploads.total}
              </>
            ) : (
              <>
                <Upload size={14} strokeWidth={1.5} />
                Upload images
              </>
            )}
          </button>
        }
      />

      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        multiple
        className="sr-only"
        onChange={(event) => handleFiles(event.target.files)}
      />

      <div className="mb-6 flex flex-wrap items-center gap-4">
        <div className="no-scrollbar flex gap-2 overflow-x-auto">
          {['all', ...BRANDS].map((option) => (
            <button
              key={option}
              type="button"
              onClick={() => setBrand(option)}
              aria-pressed={brand === option}
              className={`shrink-0 whitespace-nowrap border px-3.5 py-2 font-sans text-[0.625rem] font-medium uppercase tracking-[0.16em] transition-colors ${
                brand === option
                  ? 'border-gold-lift bg-gold-lift text-ink'
                  : 'border-ink-line text-ivory-dim hover:border-gold-deep hover:text-gold-lift'
              }`}
            >
              {option === 'all' ? 'All acts' : option}
            </button>
          ))}
        </div>

        <div className="flex min-w-64 flex-1 gap-2">
          <input
            type="url"
            className="field"
            placeholder="Or paste an image or video path"
            value={urlDraft}
            onChange={(event) => setUrlDraft(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === 'Enter') {
                event.preventDefault()
                addByUrl()
              }
            }}
            aria-label="Add image or video by path or URL"
          />
          <button type="button" onClick={addByUrl} className="btn btn-gold btn-sm shrink-0">
            Add
          </button>
        </div>
      </div>

      {error ? (
        <p role="alert" className="mb-6 border border-velvet/50 bg-velvet-deep/25 p-4 text-sm">
          {error}
        </p>
      ) : null}

      {isLoading ? (
        <Spinner label="Loading gallery" />
      ) : loadError ? (
        <ErrorState error={loadError} onRetry={reload} />
      ) : items.length === 0 ? (
        <EmptyState
          icon={ImagePlus}
          title="No images yet"
          description="Upload photographs from the last evening, or paste a URL to an existing one."
          action={
            <button
              type="button"
              onClick={() => inputRef.current?.click()}
              className="btn btn-buy btn-sm"
            >
              Upload images
            </button>
          }
        />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {items.map((item) => (
            <article key={item.id} className="surface overflow-hidden">
              <div className="relative aspect-[3/2] bg-ink-soft">
                <img
                  src={item.mediaType === 'video' ? item.poster || '' : item.image}
                  alt=""
                  className="size-full object-cover"
                />

                {item.mediaType === 'video' ? (
                  <span className="pointer-events-none absolute left-2 top-2 flex items-center gap-1.5 border border-ink-line bg-ink/85 px-2 py-1 text-[0.5625rem] uppercase tracking-[0.16em] text-gold-lift">
                    <Film size={11} strokeWidth={1.5} />
                    Video
                  </span>
                ) : null}

                <div className="absolute right-2 top-2 flex gap-1.5">
                  <button
                    type="button"
                    onClick={() => patch(item, { featured: !item.featured })}
                    disabled={busyId === item.id}
                    title={item.featured ? 'Remove from the home page strip' : 'Feature on the home page'}
                    aria-label={item.featured ? 'Unfeature image' : 'Feature image'}
                    className={`grid size-8 place-items-center border bg-ink/85 transition-colors ${
                      item.featured
                        ? 'border-gold-lift text-gold-lift'
                        : 'border-ink-line text-ivory-dim hover:text-gold-lift'
                    }`}
                  >
                    <Star size={13} strokeWidth={1.5} fill={item.featured ? 'currentColor' : 'none'} />
                  </button>

                  <button
                    type="button"
                    onClick={() => patch(item, { isPublished: !item.isPublished })}
                    disabled={busyId === item.id}
                    title={item.isPublished ? 'Hide from the site' : 'Show on the site'}
                    aria-label={item.isPublished ? 'Hide image' : 'Publish image'}
                    className="grid size-8 place-items-center border border-ink-line bg-ink/85 text-ivory-dim transition-colors hover:text-gold-lift"
                  >
                    {item.isPublished ? (
                      <Eye size={13} strokeWidth={1.5} />
                    ) : (
                      <EyeOff size={13} strokeWidth={1.5} />
                    )}
                  </button>

                  <button
                    type="button"
                    onClick={() => remove(item)}
                    disabled={busyId === item.id}
                    className="grid size-8 place-items-center border border-ink-line bg-ink/85 text-ivory-dim transition-colors hover:border-velvet hover:text-velvet-lift"
                    aria-label="Delete image"
                  >
                    <Trash2 size={13} strokeWidth={1.5} />
                  </button>
                </div>

                {!item.isPublished ? (
                  <p className="absolute bottom-2 left-2 border border-ink-line bg-ink/85 px-2 py-1 text-[0.5625rem] uppercase tracking-[0.16em] text-ivory-dim">
                    Hidden
                  </p>
                ) : null}
              </div>

              <div className="space-y-3 p-4">
                <EditableField
                  label="Title"
                  value={item.title}
                  placeholder="Untitled"
                  onSave={(title) => patch(item, { title })}
                />
                <EditableField
                  label="Caption"
                  value={item.caption}
                  placeholder="Add a caption"
                  onSave={(caption) => patch(item, { caption })}
                />

                {item.mediaType === 'video' ? (
                  <EditableField
                    label="Poster still"
                    value={item.posterId}
                    placeholder="Poster path, e.g. /media/brand/clip.jpg"
                    onSave={(poster) => patch(item, { poster })}
                  />
                ) : null}

                <div className="grid grid-cols-2 gap-2">
                  <select
                    className="field py-2 text-xs"
                    value={item.brand}
                    onChange={(event) => patch(item, { brand: event.target.value })}
                    aria-label="Act"
                  >
                    {BRANDS.map((option) => (
                      <option key={option} value={option}>
                        {option}
                      </option>
                    ))}
                  </select>

                  <select
                    className="field py-2 text-xs"
                    value={item.category}
                    onChange={(event) => patch(item, { category: event.target.value })}
                    aria-label="Category"
                  >
                    {[...new Set([item.category, ...CATEGORIES])].map((option) => (
                      <option key={option} value={option}>
                        {option}
                      </option>
                    ))}
                  </select>
                </div>

                <select
                  className="field py-2 text-xs"
                  value={item.orientation}
                  onChange={(event) => patch(item, { orientation: event.target.value })}
                  aria-label="Tile shape"
                >
                  <option value="landscape">Wide tile</option>
                  <option value="portrait">Tall tile</option>
                  <option value="square">Square tile</option>
                </select>
              </div>
            </article>
          ))}
        </div>
      )}
    </>
  )
}

/** Inline text field that only commits on blur or Enter. */
function EditableField({ label, value, placeholder, onSave }) {
  const [draft, setDraft] = useState(value ?? '')
  const [isDirty, setIsDirty] = useState(false)

  const commit = () => {
    if (!isDirty) return
    onSave(draft)
    setIsDirty(false)
  }

  return (
    <div className="relative">
      <input
        className="field py-2 text-xs"
        value={draft}
        placeholder={placeholder}
        aria-label={label}
        onChange={(event) => {
          setDraft(event.target.value)
          setIsDirty(true)
        }}
        onBlur={commit}
        onKeyDown={(event) => {
          if (event.key === 'Enter') {
            event.preventDefault()
            event.currentTarget.blur()
          }
        }}
      />
      {isDirty ? (
        <Check
          size={13}
          strokeWidth={2}
          className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-gold-lift"
        />
      ) : null}
    </div>
  )
}
