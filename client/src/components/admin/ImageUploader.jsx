import { ImagePlus, Link2, Loader2, Trash2, Upload } from 'lucide-react'
import { useRef, useState } from 'react'
import { uploadImage } from '../../lib/api'

/**
 * Picks an image for a record.
 *
 * Two ways in: upload straight to Cloudflare Images (the file never touches our
 * server), or paste a URL. The URL route is not a fallback for convenience.
 * It is what keeps the admin usable before the Cloudflare credentials are in
 * place, and it lets an existing hosted image be reused without re-uploading.
 *
 * The stored value is either a Cloudflare image id or a full URL; the API
 * resolves whichever it gets into a delivery URL.
 */
export default function ImageUploader({
  value,
  preview,
  onChange,
  label = 'Image',
  hint,
  aspect = 'aspect-[3/2]',
}) {
  const inputRef = useRef(null)
  const [isUploading, setIsUploading] = useState(false)
  const [error, setError] = useState(null)
  const [isUrlMode, setIsUrlMode] = useState(false)
  const [urlDraft, setUrlDraft] = useState('')

  const previewSrc = preview || (value?.startsWith('http') ? value : '')

  const handleFile = async (file) => {
    if (!file) return

    if (!file.type.startsWith('image/')) {
      setError('Pick an image file')
      return
    }
    if (file.size > 10 * 1024 * 1024) {
      setError('Images need to be under 10MB')
      return
    }

    setIsUploading(true)
    setError(null)

    try {
      const result = await uploadImage(file, label)
      onChange(result.imageId, result.url)
    } catch (caught) {
      setError(caught.message)
    } finally {
      setIsUploading(false)
    }
  }

  const applyUrl = () => {
    const trimmed = urlDraft.trim()
    if (!trimmed) return
    onChange(trimmed, trimmed)
    setUrlDraft('')
    setIsUrlMode(false)
    setError(null)
  }

  return (
    <div>
      <div className="mb-2 flex items-center justify-between">
        <span className="field-label mb-0">{label}</span>
        <button
          type="button"
          onClick={() => setIsUrlMode((mode) => !mode)}
          className="flex items-center gap-1.5 text-xs text-ivory-faint transition-colors hover:text-gold-lift"
        >
          <Link2 size={12} strokeWidth={1.5} />
          {isUrlMode ? 'Upload a file instead' : 'Paste a URL instead'}
        </button>
      </div>

      {isUrlMode ? (
        <div className="flex gap-2">
          <input
            type="url"
            className="field"
            placeholder="https://images.example.com/photo.jpg"
            value={urlDraft}
            onChange={(event) => setUrlDraft(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === 'Enter') {
                event.preventDefault()
                applyUrl()
              }
            }}
          />
          <button type="button" className="btn btn-gold btn-sm shrink-0" onClick={applyUrl}>
            Use
          </button>
        </div>
      ) : (
        <div
          className={`relative overflow-hidden border border-dashed border-ink-line bg-ink transition-colors hover:border-gold-deep ${aspect}`}
          onDragOver={(event) => event.preventDefault()}
          onDrop={(event) => {
            event.preventDefault()
            handleFile(event.dataTransfer.files?.[0])
          }}
        >
          {previewSrc ? (
            <img src={previewSrc} alt="" className="size-full object-cover" />
          ) : null}

          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            disabled={isUploading}
            className={`absolute inset-0 flex flex-col items-center justify-center gap-2 text-center transition-colors ${
              previewSrc
                ? 'bg-ink/70 opacity-0 hover:opacity-100'
                : 'text-ivory-faint hover:text-gold-lift'
            }`}
          >
            {isUploading ? (
              <>
                <Loader2 size={22} strokeWidth={1.5} className="animate-spin text-gold" />
                <span className="u-meta">Uploading</span>
              </>
            ) : (
              <>
                {previewSrc ? (
                  <Upload size={20} strokeWidth={1.5} />
                ) : (
                  <ImagePlus size={22} strokeWidth={1.5} />
                )}
                <span className="u-meta">
                  {previewSrc ? 'Replace' : 'Upload or drop an image'}
                </span>
              </>
            )}
          </button>

          {previewSrc ? (
            <button
              type="button"
              onClick={() => onChange('', '')}
              className="absolute right-2 top-2 grid size-8 place-items-center border border-ink-line bg-ink/85 text-ivory-dim transition-colors hover:border-velvet hover:text-velvet-lift"
              aria-label={`Remove ${label}`}
            >
              <Trash2 size={13} strokeWidth={1.5} />
            </button>
          ) : null}

          <input
            ref={inputRef}
            type="file"
            accept="image/*"
            className="sr-only"
            onChange={(event) => handleFile(event.target.files?.[0])}
          />
        </div>
      )}

      {error ? <p className="mt-2 text-xs text-velvet-lift">{error}</p> : null}
      {hint && !error ? <p className="mt-2 text-xs text-ivory-faint">{hint}</p> : null}
    </div>
  )
}
